const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '../../data');
const dataFile = path.join(dataDirectory, 'store.json');
let store;
let pendingOperation = Promise.resolve();

function clone(value) {
    if (value === undefined || value === null) return value;
    return JSON.parse(JSON.stringify(value));
}

function loadStore() {
    if (store) return store;

    fs.mkdirSync(dataDirectory, { recursive: true });
    if (!fs.existsSync(dataFile)) store = {};
    else {
        try {
            store = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch (error) {
            throw new Error(`JSON veritabanı okunamadı: ${error.message}`);
        }
    }

    return store;
}

function saveStore() {
    fs.mkdirSync(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    fs.writeFileSync(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
    fs.renameSync(temporaryFile, dataFile);
}

function enqueue(operation) {
    const result = pendingOperation.then(operation);
    pendingOperation = result.catch(() => {});
    return result;
}

function getCollection(name) {
    const database = loadStore();
    if (!Array.isArray(database[name])) database[name] = [];
    return database[name];
}

function valueMatches(value, expected) {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
        if ('$lte' in expected) return value <= expected.$lte;
        if ('$lt' in expected) return value < expected.$lt;
        if ('$gte' in expected) return value >= expected.$gte;
        if ('$gt' in expected) return value > expected.$gt;
        if ('$ne' in expected) return value !== expected.$ne;
        if ('$in' in expected) return expected.$in.includes(value);
    }
    return value === expected;
}

function matches(document, filter = {}) {
    return Object.entries(filter).every(([key, expected]) => valueMatches(document[key], expected));
}

function defaultDocument(defaults, data = {}) {
    const document = {};
    Object.entries(defaults).forEach(([key, value]) => {
        document[key] = typeof value === 'function' ? value() : clone(value);
    });
    Object.assign(document, clone(data) || {});
    return document;
}

function applyUpdate(document, update, isInsert = false) {
    if (!update || typeof update !== 'object') return document;

    Object.entries(update.$setOnInsert || {}).forEach(([key, value]) => {
        if (isInsert) document[key] = clone(value);
    });
    Object.entries(update.$set || {}).forEach(([key, value]) => {
        document[key] = clone(value);
    });
    Object.entries(update.$inc || {}).forEach(([key, value]) => {
        document[key] = (Number(document[key]) || 0) + Number(value);
    });
    Object.entries(update.$push || {}).forEach(([key, value]) => {
        if (!Array.isArray(document[key])) document[key] = [];
        if (value && Array.isArray(value.$each)) document[key].push(...clone(value.$each));
        else document[key].push(clone(value));
    });

    Object.entries(update).forEach(([key, value]) => {
        if (!key.startsWith('$')) document[key] = clone(value);
    });
    return document;
}

class JsonQuery {
    constructor(executor) {
        this.executor = executor;
        this.sortFields = null;
        this.selectedFields = null;
        this.isLean = false;
    }

    sort(fields) {
        this.sortFields = fields;
        return this;
    }

    select(fields) {
        this.selectedFields = fields;
        return this;
    }

    lean() {
        this.isLean = true;
        return this;
    }

    async exec() {
        let result = await this.executor();
        const isArray = Array.isArray(result);
        let documents = isArray ? result : (result ? [result] : []);

        if (this.sortFields) {
            documents.sort((left, right) => {
                for (const [field, direction] of Object.entries(this.sortFields)) {
                    if (left[field] === right[field]) continue;
                    return (left[field] > right[field] ? 1 : -1) * direction;
                }
                return 0;
            });
        }

        if (this.selectedFields) {
            const fields = String(this.selectedFields).split(/\s+/).filter(Boolean);
            documents = documents.map(document => {
                const selected = { _id: document._id };
                fields.forEach(field => {
                    if (document[field] !== undefined) selected[field] = document[field];
                });
                return selected;
            });
        }

        if (this.isLean) documents = documents.map(document => clone(document));
        return isArray ? documents : (documents[0] || null);
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }

    catch(reject) {
        return this.exec().catch(reject);
    }
}

function createJsonModel(name, defaults = {}) {
    class JsonDocument {
        constructor(data = {}) {
            Object.assign(this, defaultDocument(defaults, data));
            if (!this._id) this._id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }

        async save() {
            return enqueue(async () => {
                const collection = getCollection(name);
                const index = collection.findIndex(document => document._id === this._id);
                const saved = clone(this);
                if (index === -1) collection.push(saved);
                else collection[index] = saved;
                saveStore();
                return this;
            });
        }
    }

    JsonDocument.find = filter => new JsonQuery(() => enqueue(async () => getCollection(name)
        .filter(document => matches(document, filter))
        .map(document => new JsonDocument(document))));
    JsonDocument.findOne = filter => new JsonQuery(() => enqueue(async () => {
        const document = getCollection(name).find(item => matches(item, filter));
        return document ? new JsonDocument(document) : null;
    }));
    JsonDocument.findById = id => JsonDocument.findOne({ _id: id });
    JsonDocument.countDocuments = filter => new JsonQuery(() => enqueue(async () => getCollection(name).filter(document => matches(document, filter)).length));
    JsonDocument.create = data => {
        if (Array.isArray(data)) return Promise.all(data.map(item => new JsonDocument(item).save()));
        return new JsonDocument(data).save();
    };
    JsonDocument.findOneAndUpdate = (filter, update, options = {}) => enqueue(async () => {
        const collection = getCollection(name);
        let index = collection.findIndex(document => matches(document, filter));
        const isInsert = index === -1;
        const document = isInsert
            ? defaultDocument(defaults, Object.fromEntries(Object.entries(filter).filter(([, value]) => value === null || typeof value !== 'object')))
            : collection[index];

        if (isInsert && !options.upsert) return null;
        applyUpdate(document, update, isInsert);
        if (isInsert) {
            document._id = document._id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            collection.push(document);
            index = collection.length - 1;
        }
        saveStore();
        return new JsonDocument(collection[index]);
    });
    JsonDocument.findOneAndDelete = filter => enqueue(async () => {
        const collection = getCollection(name);
        const index = collection.findIndex(document => matches(document, filter));
        if (index === -1) return null;
        const [removed] = collection.splice(index, 1);
        saveStore();
        return new JsonDocument(removed);
    });
    JsonDocument.deleteOne = filter => enqueue(async () => {
        const collection = getCollection(name);
        const index = collection.findIndex(document => matches(document, filter));
        if (index === -1) return { acknowledged: true, deletedCount: 0 };
        collection.splice(index, 1);
        saveStore();
        return { acknowledged: true, deletedCount: 1 };
    });

    return JsonDocument;
}

module.exports = { createJsonModel };