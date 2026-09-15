
# ✨ Kurulum
### Projeyi botunuzda kullanmak için bazı işlemler yapmanız gerekiyor. Aşağıdaki yönlendirmeleri takip ederek bunu yapabilirsiniz :
* Herkesin bildiği gibi ilk önce bilgisayarınıza Node JS ve ayarları daha rahat yapabilmek için bir editör *(örneğin Visual Studio Code)* indirmeniz gerekiyor.
* Botun kalıcı verileri tek sunucu için `data/store.json` dosyasında tutulur. Bu dosya bot çalışırken otomatik oluşturulur.
* Projeyi zip dosyası halinde indirin ve herhangi bir klasöre zip dosyasını çıkarın.
* Bot tokenini kaynak koduna yazmak yerine çalışma ortamında yalnızca `DISCORD_TOKEN` ortam değişkenini tanımlayın. Sunucu ve rol ID'leri gibi bot ayarlarını `src/configs/settings.js` içindeki ilgili alanlara girin.
* Daha sonra editörünüzün terminalini yada klasörünuzun bulunduğu dizinde `cmd` veya `powershell` penceresini açın.
* Ve `npm i` yazarak otomatik olarak gerekli tüm modülleri indirin.
* Bu işlem de bittikten sonra pencerede `node .` veya `npm start` yazarak botunuzu çalıştırın!
* Windows kullanıyorsanız bu işlemler için önce `kurulum.bat`, ardından `baslat.bat` dosyasını çalıştırabilirsiniz.
* Bot davet edilirken `applications.commands` yetkisini de içeren davet bağlantısını kullanın. Slash komutları `src/configs/settings.js` içindeki `guildID` doluysa sunucuya anında, boşsa global olarak kaydedilir; global komutların görünmesi Discord tarafında daha uzun sürebilir.
## Glitch kullanıcıları için :
* Glitch platformunda `New Project` butonuna tıklayın, çıkan seçimler arasında en aşağıda bulunan `Import from GitHub` seçeneğine tıklayıp çıkan pencereye altyapı adresini girin ve Tamam'a tıklayın!
* `package.json` dosyasını Glitch'e uygun olarak değiştirin!
* Ve bir kaç sistem hatası almamak için `package.json` dosyasına aşağıdaki kodu girin :
```json
"engines" : {
    "node": "12.x"
}
```

# ⚙️ Ayarlar
### Botunuzun doğru ve hatasız çalışması için `settings.js` dosyasını doğru bir şekilde doldurmanız gerekiyor. Aşağıdaki yönlendirmeleri takip ederek bazı ayarları yapabilirsiniz :

* `client.settings` ve `client.statusMessages` kısmı botunuzun, `client.systemEmojis` kısmı kullanılacak olan emojilerin ve `client.guildSettings` kısmı ise sunucunuzun gerekli ayarlarıdır.
* `DISCORD_TOKEN` tanımlı değilse bot güvenli şekilde başlatılmaz; eksik ayar mesajını konsolda gösterir.
* `eval` komutu varsayılan olarak kapalıdır. Yalnızca kontrollü bir geliştirme ortamında gerekiyorsa `ENABLE_EVAL=true` ile açın; üretimde açık bırakmayın.
* Bot tek sunucu için tasarlanmıştır; veriler `data/store.json` içinde tutulduğu için farklı botlarla ortak veritabanı kullanılmaz.
* Altyapıdaki komutların çoğunda yavaş mod mevcuttur ve bunu **Sunucu Yöneticisi** ve **Bot Altı Yönetici** yetkisine sahip yetkililere kapatmak için `client.settings.DisableCooldownsForAdmins` kısmını aktif hale getirebilirsiniz.
* `client.systemEmojis` dizini botunuzun kullanmak için sunucunuza kuracağı emoji bilgilerini gösteriyor. Dizine belirtilen şekilde yeni emoji bilgileri ekleyerek belirttiğiniz emojilerinde sunucunuza kurulmasını sağlaya bilirsiniz. Bu emojilerin kurulması için botunuzu aktifleşdirdikten sonra **Emojikur** komutunu kullanmanız gerekmektedir.
    * Bilgi: **Emojikur** komutunu kullandıktan sonra botunuz emojileri sunucuya kurar ve `src/configs/emojis.json` dosyasına kaydeder. Gerektiği zaman da bu dosyadan alıp kullanır ve sizde tüm emojileri `<:name:id>` şeklinde botunuza kaydetme zahmetinden kurtulursunuz.
    * Not: Bazı kullanıcılarda emojiler `src/configs/emojis.json` dosyasına kaydedilmeye bilir, bu durumda Emojikur komutunu kullandıktan sonra `eval JSON.stringify(emojis, null, 2)` komutunu çalıştırarak çıkan sonucu dosyaya yapıştırarak sorunu hall edebilirsiniz.
    * Not: `src/configs/emojis.json` dosyasında discordun birkaç varsayılan emojileride hazır bulunmaktadır.
* `client.guildSettings.guildTags` dizinine sunucunuzun taglarını, `client.guildSettings.guildDiscriminator` kısmına ise sunucunuzun etiket tagını *(#0000 gibi ve eğer varsa)*  **#** olmadan girmelisiniz.
    * Not: Sunucunuzda etiket tagı kullanmıyorsanız **guildDiscriminator** kısmını silmenize gerek yok. Boş bırakıp botunuza etiket tagınızın olmadığını belirtmelisiniz.
* `client.guildSettings.guildTeams` dizinine sunucunuzdaki bulunan ekiplerin *(Eğer varsa)* her birine özel yapılmış rolün ID'sini girmelisiniz.
* `client.guildSettings.meetRole` kısmına **Toplantıya Katıldı** rolünün, `client.guildSettings.meetChannel` kısmına ise sunucunuzun toplantı kanalının ID'sini girmelisiniz.
* `client.guildSettings.nameTag` kısmına sunucunuzdaki üyelerin sunucu isimlerinin başında bulunacak sembolü gire veya boş bıraka bilirsiniz.
* `client.guildSettings.dmMessages` kısmından üyelere **DM** aracılığıyla gönderilecek mesajları, `client.guildSettings.unAuthorizedMessages` kısmından ise sunucunuzda yeterli yetkisi olmayan üyelerin yetkili komutlarını kullandıkta alıcakları geridönüş mesajını açıp-kapata bilirsiniz.
* `client.guildSettings.staffRoles` dizinine **Genel Yetkili** rollerinizin, `client.guildSettings.transporterSpears` dizinine **Taşıyıcı** rollerinizin, `client.guildSettings.registerSpears` dizinine **Kayıt Yetkilisi** rollerinizin, `client.guildSettings.staffGiver` kısmına **Yetkili Alım** rolünün ve `client.guildSettings.botYt` kısmına ise sunucunuzun **Bot Altı Yönetici** rolünün ID'sini girmelisiniz.
    * Bilgi: **Bot Altı Yönetici** rolü botunuzun %75'lik kısmına diğer roller ihtiyaç olmaksızın erişe bilmesini sağlar. Eğer sunucunuzda botunuzun çoğu komutuna erişip ama **Sunucu Yöneticisi** yetkisini vermek istemediğiniz üyeler varsa onlara bu rolü verebilirsiniz.

📌 Diğer ayarlarıda doğru bir şekilde girerek bu kısmıda başarıyla tamamlaya bilirsiniz!

## Önemli: Proje MIT lisansına sahiptir ve projenin dosyalarının izin alınmadan paylaşılması, satılması  veya benzeri durumlar kesinlikle yasaktır. Böyle bir durumun yaşanması sonucunda bundan sorumlu şahıs(lar)a gerekli işlemler yapılacaktır!
