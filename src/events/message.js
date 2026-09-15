const { Collection } = require('discord.js');
const { client } = global;
const { Prefix, Owners, DisableCooldownsForAdmins } = client.settings;
const { staffRoles, botYt, unAuthorizedMessages } = client.guildSettings;
const embed = require('../utils/Embed.js');

/**
 * @param { Message } message 
 */

module.exports = async (message) => {

///Process
    if (message.author.bot) return;
    if(!message.content.startsWith(Prefix)) return;

    let args = message.content.slice(Prefix.length).trim().split(/ +/);
    let commandName = args.shift().toLocaleLowerCase();
    let command = client.commands.get(commandName) || client.commands.find(cmd =>
        Array.isArray(cmd.aliases) && cmd.aliases.includes(commandName)
    );
    let Embed = embed(message.author.username, message.author.avatarURL({ dynamic: true }), false);

    if(!command) return;

///Controls

    //Developer Control
    if (command.developer && !Owners.includes(message.author.id)) {
        
        if (!command.returnMsg) return;
        else return message.channel.error(message, command.returnMsg, { timeout: 10000 });
        
    };

    //Guild Control
    if (command.guildOnly && !message.guild) {
        return message.channel.error(message, `Bu komut yalnızca sunucu kanallarında çalışa bilmektedir!`);
    }

    //Server Owner Control
    if (command.guildOwner && message.guild && !Owners.includes(message.author.id) && message.guild.owner.id !== message.author.id) {
        
        if (unAuthorizedMessages) return message.channel.error(message, `Maalesef, bu komutu sadece sunucu sahibi kullana bilir!`, { timeout: 10000 });
        else return;
    };

    //Permission Control
    if (command.permission && message.guild && !Owners.includes(message.author.id) && !message.member.hasPermission(command.permission) && !message.member.roles.cache.has(botYt)) {
        
        if (unAuthorizedMessages) return message.channel.error(message, `Maalesef, bu komutu kullana bilmek için yeterli yetkiye sahip değilsin!`, { timeout: 10000 });
        else return;
        
    };

    //Staff Control
    if (command.staff && message.guild && !Owners.includes(message.author.id) && !message.member.hasPermission('MANAGE_ROLES') && !message.member.roles.cache.has(botYt) && !staffRoles.some(role => message.member.roles.cache.has(role))) {

        if (unAuthorizedMessages) return message.channel.error(message, `Maalesef, bu komutu kullana bilmek için yeterli yetkiye sahip değilsin!`, { timeout: 10000 });
        else return;

    };

    //Guild Control
//Operations

    //Cooldowns
    if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());
  
    let timestamps = client.cooldowns.get(command.name);
    let cooldownAmount = Number(command.cooldown || 0) * 1000;
    let now = Date.now();
  
    if (timestamps.has(message.author.id)) {
        
        let expirationtime = timestamps.get(message.author.id) + cooldownAmount;
        let timeleft = (expirationtime - now) / 1000;

        if(DisableCooldownsForAdmins) {
        
            if (expirationtime > now && !Owners.includes(message.author.id) && (!message.member || !message.member.hasPermission(8)) && (!message.member || !message.member.roles.cache.has(botYt))) return message.channel.error(message, `Bu komutu tekrar kullana bilmek için lütfen **${parseInt(timeleft) == 0 ? 1 : parseInt(timeleft)} saniye** bekleyin!`, { timeout: 5000 });
        
        } else {
        
            if (expirationtime > now && !Owners.includes(message.author.id)) return message.channel.error(message, `Bu komutu tekrar kullana bilmek için lütfen **${parseInt(timeleft) == 0 ? 1 : parseInt(timeleft)} saniye** bekleyin!`, { timeout: 5000 });

        };
        
    };
  
    timestamps.set(message.author.id, now);
    client.wait(cooldownAmount).then(() => timestamps.delete(message.author.id));

    //Running Commands
    try { 

        await command.execute(client, message, args, Embed); 

    } catch (e) {
            
        message.channel.error(message, `Hay Aksi, bu komut çalıştırılırken bir hata oluştu. Botun yapımcıları durumla ilgilenecektir, lütfen biraz sonra tekrar deneyin!`, { react: true }).catch(() => {});
        const stack = e && e.stack ? e.stack : String(e);
        Owners.filter(owner => owner !== '').forEach(async (owner, index) => {

            await client.wait(index * 500);
            const ownerUser = client.users.cache.get(owner);
            if (!ownerUser) return;
            ownerUser.send(`
**${message.channel.toString()}** adlı kanalda \`${command.name}\` adlı komut kullanılırken hata oluştu!
Komutu kullanan kişi : **${message.author.tag}** ( \`${message.author.id}\` )
            `).catch(() => {});
            for(let i = 0; i < stack.length; i += 2000) {
                ownerUser.send(stack.slice(i, i + 2000), { code: "js" }).catch(() => {});
            };

        });

    };

};

module.exports.conf = {
    name: "Commands",
    event: "message"
};