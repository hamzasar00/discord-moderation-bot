const commandDescriptions = {
    ping: 'Botun gecikmesini gösterir.',
    uptime: 'Botun ne kadar süredir açık olduğunu gösterir.',
    reload: 'Bot komutlarını yeniden yükler.',
    emojiKur: 'Sistem emojilerini sunucuya kurar.',
    eval: 'Geliştirici kod çalıştırma komutudur.',

    allmove: 'Bir ses kanalındaki herkesi başka bir ses kanalına taşır.',
    allunvmute: 'Bir ses kanalındaki herkesin sesini açar.',
    allvmute: 'Bir ses kanalındaki herkesin sesini kapatır.',
    cezapuan: 'Üyenin ceza puanını görüntüler, artırır veya azaltır.',
    ekip: 'Yetkili ekiplerini görüntüler veya ekip seçer.',
    yasaklıtag: 'Yasaklı tag ekler, siler veya listeyi gösterir.',
    katıldı: 'Sunucuya katılma rolünü verir veya kaldırır.',
    kilit: 'Kanalı yazışmaya kapatır veya açar.',
    rollog: 'Üyenin rol değişikliklerini gösterir.',
    say: 'Sunucu istatistiklerini gösterir.',
    ses: 'Üyeyi veya kanalı ses işlemleriyle yönetir.',
    sil: 'Belirtilen sayıdaki mesajı siler.',
    yavaşmod: 'Kanalın yavaş mod süresini ayarlar.',
    snipe: 'Silinen son mesajı gösterir.',
    yetkilisay: 'Sunucudaki yetkili sayısını gösterir.',
    yönetici: 'Üyeye yönetici yetkisi verir, kaldırır veya kontrol eder.',

    banbilgi: 'Bir ban kaydının ayrıntılarını gösterir.',
    cezabilgi: 'Ceza kaydının ayrıntılarını gösterir.',
    jailbilgi: 'Üyenin jail kaydını gösterir.',
    mutebilgi: 'Üyenin mute kaydını gösterir.',
    sicilbilgi: 'Üyenin tüm ceza geçmişini gösterir.',
    warnbilgi: 'Üyenin uyarı bilgilerini gösterir.',
    üyebilgi: 'Üyenin sunucu ve hesap bilgilerini gösterir.',

    ban: 'Üyeyi sunucudan yasaklar.',
    forceban: 'Sunucuda olmayan kullanıcıyı ID ile yasaklar.',
    jail: 'Üyeyi jail rolüne alır.',
    mute: 'Üyeye süreli yazılı kanal susturması uygular.',
    tempjail: 'Üyeye süreli jail cezası uygular.',
    unban: 'Kullanıcının sunucu yasağını kaldırır.',
    unjail: 'Üyenin jail cezasını kaldırır.',
    unmute: 'Üyenin yazılı kanal susturmasını kaldırır.',
    vmute: 'Üyenin sesini süreli kapatır.',
    vunmute: 'Üyenin ses susturmasını kaldırır.',
    warn: 'Üyeye uyarı cezası verir.',

    çek: 'Üyeyi bulunduğun ses kanalına çeker.',
    denetim: 'Denetim/log rolünü ayarlar.',
    kes: 'Üyeyi ses kanalından çıkarır veya bağlantısını keser.',
    rol: 'Üyeye rol verir veya üyeden rol alır.',
    taşı: 'Üyeyi başka bir ses kanalına taşır.',
    yetki: 'Yetkili ekiplerini oluşturur ve yönetir.',

    afk: 'AFK durumunu açar veya kapatır.',
    alarm: 'Belirtilen süre için alarm kurar.',
    avatar: 'Üyenin avatarını gösterir.',
    booster: 'Sunucu boost bilgilerini gösterir.',
    git: 'Üyeyi ses kanalından çıkarır.',
    servericon: 'Sunucunun ikonunu gösterir.',
    tag: 'Sunucu tag bilgisini gösterir.',
};

function formatCommand(command) {
    const usage = command.usage ? ` ${command.usage}` : '';
    const description = commandDescriptions[command.name] || 'Komutun açıklamasını ve kullanım şeklini gösterir.';
    return `**/${command.name}**${usage} — ${description}`;
}

function addCategoryFields(embed, title, commands) {
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    commands.forEach(command => {
        const nextLength = currentLength + command.length + (currentChunk.length ? 1 : 0);
        if (currentChunk.length && nextLength > 950) {
            chunks.push(currentChunk.join('\n'));
            currentChunk = [];
            currentLength = 0;
        }

        currentChunk.push(command);
        currentLength += command.length + (currentChunk.length > 1 ? 1 : 0);
    });

    if (currentChunk.length) chunks.push(currentChunk.join('\n'));

    chunks.forEach((chunk, index) => {
        const suffix = chunks.length > 1 ? ` ${index + 1}` : '';
        embed.addField(`${title}${suffix}`, chunk);
    });
}

module.exports = {
    name: 'help',
    aliases: ['yardım', 'komutlar'],
    staff: true,
    guildOnly: true,
    cooldown: 5,

    /**
     * @param { Client } client 
     * @param { Message } message 
     * @param { Array<String> } args
     * @param { MessageEmbed } Embed
     */

    execute(client, message, args, Embed) {
        const categories = ['Admin', 'Ceza', 'Yetkili', 'Bilgi', 'Kullanıcı', 'Developer'];
        const categoryTitles = {
            Admin: 'Yönetim Komutları',
            Ceza: 'Ceza Komutları',
            Yetkili: 'Yetkili Komutları',
            Bilgi: 'Bilgi Komutları',
            Kullanıcı: 'Kullanıcı Komutları',
            Developer: 'Geliştirici Komutları',
        };

        Embed
            .setTitle('Detaylı Komut Listesi')
            .setDescription('Her satırda komutun ne yaptığı ve nasıl kullanılacağı yazıyor. Köşeli parantez içindeki bilgiler isteğe bağlıdır.')
            .setColor('#5865F2');

        categories.forEach(category => {
            const commands = client.commands
                .filter(command => command.category === category && command.name !== 'eval')
                .map(formatCommand);

            if (commands.length) addCategoryFields(Embed, categoryTitles[category], commands);
        });

        message.channel.success(message, Embed.setFooter(`${client.settings.Footer} • ${message.author.username} tarafından istendi`), { react: true });

    },
};