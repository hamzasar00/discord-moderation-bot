const { Collection } = require('discord.js');
const embed = require('../utils/Embed.js');

const { Owners, DisableCooldownsForAdmins } = global.client.settings;
const { staffRoles, botYt, unAuthorizedMessages, guildID } = global.client.guildSettings;

function slugifyCommandName(name) {
    const replacements = {
        'ı': 'i',
        'İ': 'i',
        'ğ': 'g',
        'Ğ': 'g',
        'ü': 'u',
        'Ü': 'u',
        'ş': 's',
        'Ş': 's',
        'ö': 'o',
        'Ö': 'o',
        'ç': 'c',
        'Ç': 'c',
    };

    return name
        .split('')
        .map(character => replacements[character] || character)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
}

const actionChoices = values => values.map(value => ({ name: value, value }));

const customSlashOptions = {
    cezapuan: [
        { name: 'islem', description: 'Ceza puanı işlemi.', type: 3, required: false, choices: actionChoices(['ekle', 'sil']) },
        { name: 'kullanici', description: 'Puanı görüntülenecek veya değiştirilecek üye.', type: 6, required: false },
        { name: 'miktar', description: 'Eklenecek veya silinecek puan miktarı.', type: 4, required: false },
        { name: 'sebep', description: 'İşlem sebebi.', type: 3, required: false },
    ],
    yasaklıtag: [
        { name: 'islem', description: 'Yasaklı tag işlemi.', type: 3, required: false, choices: actionChoices(['ekle', 'sil', 'say', 'liste']) },
        { name: 'tag', description: 'Eklenecek veya silinecek tag.', type: 3, required: false },
    ],
    katıldı: [
        { name: 'islem', description: 'Katılma rolü işlemi.', type: 3, required: false, choices: actionChoices(['ver', 'al']) },
    ],
    yönetici: [
        { name: 'islem', description: 'Yönetici işlemi.', type: 3, required: false, choices: actionChoices(['aç', 'kapat', 'al', 'ver', 'bilgi']) },
        { name: 'hedef', description: 'İşlem yapılacak üye veya bot.', type: 3, required: false },
    ],
    rol: [
        { name: 'islem', description: 'Rol işlemi.', type: 3, required: false, choices: actionChoices(['ver', 'al']) },
        { name: 'hedef', description: 'Üye, rol veya kanal etiketi/ID’si.', type: 3, required: false },
        { name: 'rol_veya_isim', description: 'Verilecek veya alınacak rol adı/ID’si.', type: 3, required: false },
    ],
    yetki: [
        { name: 'islem', description: 'Yetki işlemi.', type: 3, required: false, choices: actionChoices(['ekle', 'sil', 'düzenle', 'ver', 'al', 'bilgi', 'liste']) },
        { name: 'isim', description: 'Yetki adı.', type: 3, required: false },
        { name: 'hedef', description: 'Üye, rol veya kanal etiketi/ID’si.', type: 3, required: false },
    ],
};

function getSlashOptionDefinitions(command) {
    const usage = command.usage || '';
    if (!usage) return [];
    if (customSlashOptions[command.name]) return customSlashOptions[command.name];

    const definitions = [];
    const counters = {};
    const addMatches = (pattern, baseName, description, type = 3) => {
        for (const match of usage.matchAll(pattern)) {
            counters[baseName] = (counters[baseName] || 0) + 1;
            definitions.push({
                position: match.index,
                name: counters[baseName] === 1 ? baseName : `${baseName}${counters[baseName]}`,
                description,
                type,
                required: false,
            });
        }
    };

    addMatches(/@Üye\/ID/gi, 'kullanici', 'Üye seç.', 6);
    addMatches(/#Kanal\/ID/gi, 'kanal', 'Kanal seç.', 7);
    addMatches(/@Rol\/ID/gi, 'rol', 'Rol seç.', 8);
    addMatches(/Sebep/gi, 'sebep', 'İşlem sebebi veya açıklaması.');
    addMatches(/Süre/gi, 'sure', 'Süre. Örnek: 1h, 30m, 10s.');
    addMatches(/Ceza ID/gi, 'ceza_id', 'Ceza ID’si.');
    addMatches(/Mesaj Sayı/gi, 'miktar', 'Mesaj sayısı.', 4);
    addMatches(/Saniye Cinsinden Sayı/gi, 'saniye', 'Saniye cinsinden süre.', 4);
    addMatches(/Ekip Numarası/gi, 'ekip', 'Ekip numarası.');
    addMatches(/Rol İsmi\/ID/gi, 'rol_veya_isim', 'Rol adı veya rol ID’si.');
    addMatches(/<ID>/gi, 'id', 'Kullanıcı veya kayıt ID’si.');

    if (!definitions.length) {
        return [{
            name: 'parametre',
            description: 'Komutun istediği bilgileri yaz.',
            type: 3,
            required: false,
        }];
    }

    return definitions
        .sort((left, right) => left.position - right.position)
        .map(({ position, ...definition }) => definition);
}

function commandPayload(command, name) {
    const usage = command.usage ? command.usage.replace(/\s+/g, ' ').trim() : '';
    const payload = {
        name,
        description: usage
            ? `Kullanım: /${name} ${usage}`.slice(0, 100)
            : `${command.name} komutu. Parametre gerekmez.`.slice(0, 100),
    };

    const options = getSlashOptionDefinitions(command);
    if (options.length) payload.options = options;

    return payload;
}

function getCommandScope(client) {
    const application = client.api.applications(client.user.id);
    return guildID ? application.guilds(guildID).commands : application.commands;
}

const slashAliases = {
    help: ['yardım', 'komutlar'],
    sicilbilgi: ['log'],
};

async function registerSlashCommands(client) {
    const desired = new Map();

    const addCommand = (name, command) => {
        const slug = slugifyCommandName(name);
        if (!slug || desired.has(slug)) return;
        desired.set(slug, command);
    };

    client.commands.forEach(command => {
        if (command.name === 'eval') return;

        addCommand(command.name, command);
        if (slashAliases[command.name]) {
            slashAliases[command.name].forEach(alias => addCommand(alias, command));
        }
    });

    client.slashCommands = new Collection();
    desired.forEach((command, name) => client.slashCommands.set(name, command));

    const scope = getCommandScope(client);
    const commandData = Array.from(desired, ([name, command]) => commandPayload(command, name));
    await scope.put({ data: commandData });

    console.log(`[SLASH] ${desired.size} komut ${guildID ? `sunucuya (${guildID})` : 'global olarak'} kaydedildi.`);

    if (guildID) {
        const globalScope = client.api.applications(client.user.id).commands;
        const globalCommands = await globalScope.get();
        if (globalCommands && globalCommands.length) {
            await globalScope.put({ data: [] });
            console.log(`[SLASH] ${globalCommands.length} eski global komut temizlendi.`);
        }
    }
}

function serializeMessage(message) {
    if (message && typeof message.toJSON === 'function') return { embeds: [message.toJSON()] };
    if (typeof message === 'string') return { content: message };
    if (message instanceof Error) return { content: message.stack || message.message };
    if (message && typeof message === 'object') {
        if (message.content || message.embeds || message.files) return message;
        return { content: String(message) };
    }
    return { content: String(message || '') };
}

function createWebhookMessage(client, interaction, channel, response) {
    const message = response || {};
    const webhook = client.api.webhooks(client.user.id, interaction.token);

    return {
        id: message.id,
        channel,
        createdTimestamp: message.timestamp ? new Date(message.timestamp).getTime() : Date.now(),
        edit: async content => webhook.messages(message.id).patch({ data: serializeMessage(content) }),
        delete: async () => webhook.messages(message.id).delete(),
    };
}

function createInteractionChannel(client, interaction, channel) {
    const interactionChannel = Object.create(channel || {});
    const webhook = client.api.webhooks(client.user.id, interaction.token);

    interactionChannel.send = async (content) => {
        const response = await webhook.post({
            data: serializeMessage(content),
            query: { wait: true },
            auth: false,
        });
        return createWebhookMessage(client, interaction, channel, response);
    };
    const safeSend = text => interactionChannel.send(text).catch(error => {
        console.error('[SLASH] Yanıt gönderilemedi', error);
        return null;
    });
    interactionChannel.success = (message, text) => safeSend(text);
    interactionChannel.error = (message, text) => safeSend(text);

    return interactionChannel;
}

function getOptionText(interaction) {
    return (interaction.data.options || [])
        .map(option => {
            const value = String(option.value);
            if (option.type === 6) return `<@${value}>`;
            if (option.type === 7) return `<#${value}>`;
            if (option.type === 8) return `<@&${value}>`;
            return value;
        })
        .join(' ')
        .trim();
}

async function getInteractionMessage(client, interaction) {
    const userID = interaction.member && interaction.member.user
        ? interaction.member.user.id
        : interaction.user.id;
    const author = client.users.cache.get(userID) || await client.fetchUser(userID);
    const guild = interaction.guild_id ? client.guilds.cache.get(interaction.guild_id) : null;
    const member = guild
        ? guild.members.cache.get(userID) || await guild.members.fetch(userID).catch(() => undefined)
        : null;
    const realChannel = client.channels.cache.get(interaction.channel_id);
    const channel = createInteractionChannel(client, interaction, realChannel);
    const rawArgs = getOptionText(interaction);
    const args = rawArgs ? rawArgs.split(/ +/) : [];
    const mentions = {
        members: new Collection(),
        roles: new Collection(),
        channels: new Collection(),
    };

    rawArgs.replace(/<@!?(\d+)>/g, (_, id) => {
        const mentionedMember = guild && guild.members.cache.get(id);
        if (mentionedMember) mentions.members.set(id, mentionedMember);
        return _;
    });
    rawArgs.replace(/<@&(\d+)>/g, (_, id) => {
        const mentionedRole = guild && guild.roles.cache.get(id);
        if (mentionedRole) mentions.roles.set(id, mentionedRole);
        return _;
    });
    rawArgs.replace(/<#(\d+)>/g, (_, id) => {
        const mentionedChannel = guild && guild.channels.cache.get(id);
        if (mentionedChannel) mentions.channels.set(id, mentionedChannel);
        return _;
    });

    return {
        id: interaction.id,
        token: interaction.token,
        author,
        member,
        guild,
        channel,
        mentions,
        content: `/${interaction.data.name}${rawArgs ? ` ${rawArgs}` : ''}`,
        createdTimestamp: Date.now(),
        react: async () => {},
        delete: async () => {},
        reply: content => channel.send(content),
    };
}

async function respondToInteraction(client, interaction, data) {
    return client.api.interactions(interaction.id, interaction.token).callback.post({ data, auth: false });
}

async function handleSlashCommand(client, interaction) {
    if (interaction && interaction.d) interaction = interaction.d;
    if (!interaction || interaction.type !== 2) return;

    const interactionName = interaction.data && interaction.data.name;
    const normalizedName = slugifyCommandName(interactionName || '');
    const command = client.slashCommands && (
        client.slashCommands.get(interactionName) ||
        client.slashCommands.get(normalizedName)
    );

    if (!command) {
        console.warn(`[SLASH] Komut bulunamadı: ${interactionName || 'unknown'}`);
        await respondToInteraction(client, interaction, {
            type: 4,
            data: { content: 'Bu slash komutu artık kullanılabilir değil. Komut listesini yenileyin.' },
        }).catch(error => console.error('[SLASH] Bilinmeyen komut yanıtlanamadı', error));
        return;
    }

    let acknowledged = false;
    try {
        await respondToInteraction(client, interaction, { type: 5, data: {} });
        acknowledged = true;

        const message = await getInteractionMessage(client, interaction);
        const guildMember = message.member;
        const permissionError = text => message.channel.error(message, text);

        if (command.developer && !Owners.includes(message.author.id)) {
            if (command.returnMsg) await permissionError(command.returnMsg);
            return;
        }
        if (command.guildOnly && !message.guild) {
            await permissionError('Bu komut yalnızca sunucu kanallarında çalışabilmektedir!');
            return;
        }
        if (command.guildOwner && message.guild && !Owners.includes(message.author.id) && message.guild.owner.id !== message.author.id) {
            if (unAuthorizedMessages) await permissionError('Maalesef, bu komutu sadece sunucu sahibi kullanabilir!');
            return;
        }
        if (command.permission && message.guild && !Owners.includes(message.author.id) && (!guildMember || !guildMember.hasPermission(command.permission)) && (!guildMember || !guildMember.roles.cache.has(botYt))) {
            if (unAuthorizedMessages) await permissionError('Maalesef, bu komutu kullanabilmek için yeterli yetkin yok!');
            return;
        }
        if (command.staff && message.guild && !Owners.includes(message.author.id) && (!guildMember || !guildMember.hasPermission('MANAGE_ROLES')) && (!guildMember || !guildMember.roles.cache.has(botYt)) && (!guildMember || !staffRoles.some(role => guildMember.roles.cache.has(role)))) {
            if (unAuthorizedMessages) await permissionError('Maalesef, bu komutu kullanabilmek için yeterli yetkin yok!');
            return;
        }

        if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = Number(command.cooldown || 0) * 1000;
        const now = Date.now();
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            const timeLeft = (expirationTime - now) / 1000;
            const adminExempt = DisableCooldownsForAdmins && guildMember && guildMember.hasPermission(8);
            const botRoleExempt = DisableCooldownsForAdmins && guildMember && guildMember.roles.cache.has(botYt);
            if (expirationTime > now && !Owners.includes(message.author.id) && !adminExempt && !botRoleExempt) {
                await permissionError(`Bu komutu tekrar kullanabilmek için lütfen **${parseInt(timeLeft) === 0 ? 1 : parseInt(timeLeft)} saniye** bekleyin!`);
                return;
            }
        }

        timestamps.set(message.author.id, now);
        client.wait(cooldownAmount).then(() => timestamps.delete(message.author.id));

        const commandEmbed = embed(message.author.username, message.author.avatarURL({ dynamic: true }), false);
        await command.execute(client, message, getOptionText(interaction).split(/ +/).filter(Boolean), commandEmbed);
    } catch (error) {
        console.error(`[SLASH] ${interaction.data.name} failed`, error);
        const content = 'Slash komutu çalıştırılırken bir hata oluştu.';
        if (acknowledged) {
            const channel = createInteractionChannel(client, interaction, client.channels.cache.get(interaction.channel_id));
            await channel.send(content).catch(() => {});
        } else {
            await respondToInteraction(client, interaction, { type: 4, data: { content } }).catch(() => {});
        }
    }
}

module.exports = {
    registerSlashCommands,
    handleSlashCommand,
    slugifyCommandName,
};