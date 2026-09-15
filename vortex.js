const { Client, Collection } = require('discord.js');
const client = (global.client = new Client({ fetchAllMembers: true }));
const { readdirSync, statSync } = require('fs');
require('./src/configs/settings.js')(client);
require('./src/handlers/functions.js')(client);
const { Token } = client.settings;

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Handlers
require('./src/handlers/mongoHandler.js');
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
