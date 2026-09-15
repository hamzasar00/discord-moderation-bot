const { handleSlashCommand } = require('../handlers/slashCommandHandler.js');

module.exports = async interaction => {
    await handleSlashCommand(global.client, interaction);
};

module.exports.conf = {
    name: 'Slash Commands',
    event: 'INTERACTION_CREATE',
};