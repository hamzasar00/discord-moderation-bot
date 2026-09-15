const { writeFile } = require('fs').promises;
const { systemEmojis } = global.client;
const emojis = require('../../configs/emojis.json');

module.exports = {
    name: 'emojikur',
    aliases: ['emoji-kur'],
    category: 'Developer',
    developer: true,

    /**
     * @param { Client } client 
     * @param { Message } message 
     * @param { Array<String> } args 
     */

    async execute(client, message, args) {

        const msg = await message.channel.send(`**Sistem emojileri kurulmaya başladı** ${emojis.loading ? emojis.loading : ``}`);
        const missingEmojis = systemEmojis.filter(systemEmoji => !emojis[systemEmoji.emojiName]);

        for (const [index, systemEmoji] of missingEmojis.entries()) {
            const existingEmoji = message.guild.emojis.cache.find(e => e.name == systemEmoji.emojiName);
            if (existingEmoji) {
                emojis[systemEmoji.emojiName] = existingEmoji.toString();
                continue;
            }

            await client.wait(index * 250);
            const createdEmoji = await message.guild.emojis.create(systemEmoji.emojiUrl, systemEmoji.emojiName);
            emojis[createdEmoji.name] = createdEmoji.toString();
        }

        await writeFile('./src/configs/emojis.json', JSON.stringify(emojis, null, 2));
        await msg.edit(`**Sistem emojileri başarıyla kuruldu ${emojis['success']}**`);

    },
};