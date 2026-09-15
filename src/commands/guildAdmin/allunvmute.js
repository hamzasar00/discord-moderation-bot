const { voiceLog } = global.client.guildSettings.logs;
const { mark, loading, success, unMuted } = require('../../configs/emojis.json');

module.exports = {
    name: 'allunvmute',
    aliases: ['allunmute'],
    category: 'Admin',
    usage: '<#Kanal/ID> <Sebep>',
    permission: 'ADMINISTRATOR',
    guildOnly: true,
    cooldown: 3,

    /**
     * @param { Client } client 
     * @param { Message } message 
     * @param { Array<String> } args
     * @param { MessageEmbed } Embed
     */

    execute(client, message, args, Embed) {

        let channel = message.guild.channels.cache.get(args[0]) || message.member.voice.channel;
        const applyUnmute = async (members, reason) => Promise.all(members.map(async (member, index) => {
            await client.wait((index + 1) * 300);
            await member.voice.setMute(false, { reason: !reason ? `${message.author.username} tarafından susturulmanın kaldırılması istendi` : reason });

            if(voiceLog) {
                const vLog = message.guild.channels.cache.get(voiceLog);
                if(vLog && vLog.type == 'text') await vLog.send(`${unMuted ? unMuted : ``} \`${member.displayName}\` üyesinin ${member.voice.channel.toString()} adlı ses kanalındaki susturulması \`${message.member.displayName}\` tarafından **kaldırıldı!**`);
            }
        }));

        if(!channel) return message.channel.error(message, Embed.setDescription(`Bir ses kanalında olmalı ve ya kanal ID'si girmelisin!`), { timeout: 10000, react: true });
 
        if(!message.member.voice.channel && args[0]) {

            if(!message.guild.channels.cache.get(args[0]) || (message.mentions.channels.first() && message.mentions.channels.first().type !== 'voice')) return message.channel.error(message, Embed.setDescription(`Geçerli bir ses kanalı belirtmelisin`), { timeout: 10000, react: true });
            if(channel.members.size == 0) return message.channel.error(message, Embed.setDescription(`Belirttiğin kanalda herhangi bir üye bulunmuyor!`), { timeout: 10000, react: true });
            if(channel.members.filter(member => member.voice.serverMute).size == 0) return message.channel.error(message, Embed.setDescription(`Belirttiğin ses kanalında susturulmuş bir üye bulunmuyor!`), { timeout: 10000, react: true });

            let totalMembers = channel.members.filter(member => member.voice.serverMute).size;
            let reason = args.slice(1).join(' ');
            if(mark) message.react(mark);
            message.channel.send(Embed.setDescription(`${channel.toString()} adlı ses kanalındaki üyelerin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} kaldırılmaya başlandı ${loading ? loading : ``} `)).then(async msg => {
                await applyUnmute(channel.members.filter(member => member.voice.serverMute), reason);
                await msg.edit(Embed.setDescription(`${success ? success : ``} ${channel.toString()} adlı ses kanalındaki **${totalMembers}** üyenin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} **kaldırıldı!**`));

            });

        } else if(message.member.voice.channel) {

            if(!args[0] || !message.guild.channels.cache.get(args[0])) {

                channel = message.member.voice.channel;

                if(channel.members.size == 0) return message.channel.error(message, Embed.setDescription(`Belirttiğin kanalda herhangi bir üye bulunmuyor!`), { timeout: 10000, react: true });
                if(channel.members.filter(member => member.voice.serverMute).size == 0) return message.channel.error(message, Embed.setDescription(`Bulunduğun ses kanalında susturulmuş bir üye bulunmuyor!`), { timeout: 10000, react: true });

                let totalMembers = channel.members.filter(member => member.voice.serverMute).size;
                let reason;
                if(args[0]) reason = args.slice(0).join(' ');
                if(mark) message.react(mark);
                message.channel.send(Embed.setDescription(`${channel.toString()} adlı ses kanalındaki üyelerin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} kaldırılmaya başlandı ${loading ? loading : ``} `)).then(async msg => {

                    await applyUnmute(channel.members.filter(member => member.voice.serverMute), reason);
                    await msg.edit(Embed.setDescription(`${success ? success : ``} ${channel.toString()} adlı ses kanalındaki **${totalMembers}** üyenin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} **kaldırıldı!**`));

                });
                
            } else if(args[0] && message.guild.channels.cache.get(args[0]) && channel.type == 'voice') {

                channel = message.guild.channels.cache.get(args[0]);

                if(channel.members.size == 0) return message.channel.error(message, Embed.setDescription(`Belirttiğin kanalda herhangi bir üye bulunmuyor!`), { timeout: 10000, react: true })
                if(channel.members.filter(member => member.voice.serverMute).size == 0) return message.channel.error(message, Embed.setDescription(`Belirttiğin ses kanlında susturulmuş bir üye bulunmuyor!`), { timeout: 10000, react: true });

                let totalMembers = channel.members.filter(member => member.voice.serverMute).size;
                let reason;
                if(args[1]) reason = args.slice(1).join(' ');
                if(mark) message.react(mark);
                message.channel.send(Embed.setDescription(`${channel.toString()} adlı ses kanalındaki üyelerin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} kaldırılmaya başlandı ${loading ? loading : ``} `)).then(async msg => {

                    await applyUnmute(channel.members.filter(member => member.voice.serverMute), reason);
                    await msg.edit(Embed.setDescription(`${success ? success : ``} ${channel.toString()} adlı ses kanalındaki **${totalMembers}** üyenin susturulması ${!reason ? '' : `\`${reason}\` nedeniyle`} **kaldırıldı!**`));

                });

            };

        };

    },
};