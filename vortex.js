const { Client, Collection } = require('discord.js');
const client = (global.client = new Client({ fetchAllMembers: true }));
const { existsSync, readFileSync, readdirSync, statSync } = require('fs');
const path = require('path');

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!existsSync(envPath)) return;

    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        const separator = trimmedLine.indexOf('=');
        if (separator === -1) continue;

        const key = trimmedLine.slice(0, separator).trim();
        let value = trimmedLine.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

loadEnvFile();
require('./src/configs/settings.js')(client);
require('./src/handlers/functions.js')(client);
const { Token } = client.settings;

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Handlers
require('./src/handlers/eventHandler.js');

// Checking Commands
for (const dir of readdirSync('./src/commands')) {
    const commandDirectory = `./src/commands/${dir}`;
    if (!statSync(commandDirectory).isDirectory()) continue;
    const commandFiles = readdirSync(commandDirectory).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`${commandDirectory}/${file}`);
        client.commands.set(command.name, command);
        // console.log(`[COMMAND] ${command.name} Loaded!`);
    }
}

// Connecting To Client
if (!Token) {
    console.error('[BOT] DISCORD_TOKEN is not configured. Set it in the environment or src/configs/settings.js.');
    process.exit(1);
}

client.login(Token).then(() => console.log('[BOT] Connection started')).catch(() => {
    console.log('[BOT] Failed to start connection, trying again');
    process.exit();
});
