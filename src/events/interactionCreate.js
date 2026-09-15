const { handleSlashCommand } = require('../handlers/slashCommandHandler.js');

module.exports = async packet => {
    const interaction = packet && packet.d ? packet.d : packet;
    const commandName = interaction && interaction.data ? interaction.data.name : 'unknown';

    console.log(`[SLASH] Interaction received: ${commandName}`);
    await handleSlashCommand(global.client, interaction);
};

module.exports.conf = {
    name: 'Slash Commands',
    event: 'INTERACTION_CREATE',
};