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

function commandPayload(command) {
    return {
        name: slugifyCommandName(command.name),
        description: `${command.name} komutunu çalıştırır.`.slice(0, 100),
        options: [{
            name: 'args',
            description: 'Komut parametreleri (ID, sebep veya diğer değerler).',
            type: 3,
            required: false,
        }],
    };
}

function getCommandScope(client) {
    const application = client.api.applications(client.user.id);
    return guildID ? application.guilds(guildID).commands : application.commands;
}

async function registerSlashCommands(client) {
    const desired = new Map();
    client.commands.forEach(command => {
        if (command.name === 'eval') return;

        const name = slugifyCommandName(command.name);
        if (!name || desired.has(name)) return;
        desired.set(name, command);
    });

    client.slashCommands = new Collection();
    desired.forEach((command, name) => client.slashCommands.set(name, command));

    const scope = getCommandScope(client);
    const registered = await scope.get();
    const registeredByName = new Map((registered || []).map(command => [command.name, command]));

    for (const [name, command] of desired) {
        const data = commandPayload(command);
        const current = registeredByName.get(name);

        if (current) await scope(current.id).patch({ data });
        else await scope.post({ data });
    }

    console.log(`[SLASH] ${desired.size} komut ${guildID ? `sunucuya (${guildID})` : 'global olarak'} kaydedildi.`);
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
        const response = await webhook.post({ data: serializeMessage(content) });
        return createWebhookMessage(client, interaction, channel, response);
    };
    interactionChannel.success = (message, text) => interactionChannel.send(text);
    interactionChannel.error = (message, text) => interactionChannel.send(text);

    return interactionChannel;
}

function getOptionText(interaction) {
    return (interaction.data.options || [])
        .filter(option => option.name === 'args')
        .map(option => String(option.value))
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
    return client.api.interactions(interaction.id, interaction.token).callback.post({ data });
}

async function handleSlashCommand(client, interaction) {
    if (!interaction || interaction.type !== 2) return;

    const command = client.slashCommands && client.slashCommands.get(interaction.data.name);
    if (!command) return;

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