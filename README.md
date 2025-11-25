# Interactions V2 

---
## English

### 1. Overview
`ACARDJSComponentsV2` is a small utility class that lets you build rich, panel‑style Discord messages by directly assembling raw component payloads (container, sections, buttons, select menus, media, dividers, text). It works with a standard `Client` instance from discord.js v13 or v14 and communicates via REST using `fetch`.

### 2. Requirements
- Node.js >= 16 (Node 18+ recommended; includes native `fetch`)
- discord.js v13 or v14 (you pass its `Client` to the constructor)
- If on Node <18: `npm install node-fetch`

### 3. Installation
```bash
npm install node-fetch # only if your Node version lacks fetch
```
Project usage:
```js
const ACARDJSComponentsV2 = require('./index.js');
```
Optional alias:
```js
const createPanel = ACARDJSComponentsV2;
```

### 4. Quick Start (discord.js v14 Example)
```js
// v14 example; for v13 replace GatewayIntentBits with Intents.FLAGS
const { Client, GatewayIntentBits } = require('discord.js');
const ACARDJSComponentsV2 = require('./index.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('messageCreate', async (message) => {
  if (message.content === '!panel') {
    // Build panel (color may be 'random' OR a HEX string OR a number)
    const panel = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('random') // or '#5865F2' or 0x5865F2
      .addContent(`-# ${message.guild.name}`)
      .addLine()
      .addContent(['Info line 1', 'Info line 2'].map(x => `-# ${x}`).join('\n'));

    // Send to the channel (you can pass channel id, channel object, or message)
    const sent = await panel.send(message.channel.id);

    // Later update (edit) — we append more components then patch
    panel.addLine().addContent('Panel updated');
    await panel.edit(sent); // can pass message object or message id
  }
});

client.login(process.env.BOT_TOKEN);
```

#### 4.1 discord.js v13 Equivalent
Below is the same logic adapted for discord.js v13 (major differences: intents constant names, message event name is still `messageCreate`, but you import `Intents` not `GatewayIntentBits`).
```js
const { Client, Intents } = require('discord.js');
const ACARDJSComponentsV2 = require('./index.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

client.on('messageCreate', async (message) => {
  if (message.content === '!panel') {
    const panel = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('#5865F2') // can be 'random'
      .addContent(`-# ${message.guild.name}`)
      .addLine()
      .addContent(['Info line 1','Info line 2'].map(x => `-# ${x}`).join('\n'));

    const sent = await panel.send(message.channel.id);
    panel.addLine().addContent('Panel updated');
    await panel.edit(sent);
  }
});

client.login(process.env.BOT_TOKEN);
```

### 5. Reply Example (Alternative Flow)
```js
client.on('messageCreate', async (message) => {
  if (message.content === '!replypanel') {
    const replyPanel = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('#ff9900')
      .addContent('Reply Panel Header')
      .addLine()
      .addContent('Some details under the header');

    await replyPanel.reply(message, { mention: false });
  }
});
```

### 6. Color Handling
`setColor(input)` accepts:
- `'random'`
- Hex string with or without `#` (e.g. `#5865F2`, `5865F2`, `0x5865F2`)
- Number (e.g. `0x5865F2`)
Throws if invalid format.

### 7. Core Methods
- `setContainer()` → create root container `{ type:17 }`.
- `setColor(value)` → set `accent_color`.
- `addContent(text)` → push text component `{ type:10 }`.
- `addLine(divider=true, spacing=0)` → divider `{ type:14 }`.
- `addMedia(array)` → media block `{ type:12 }`.
- `addSection({ texts, accessory })` → section `{ type:9 }` with chainable: `setAccessory`, `addButton`, `addImage`, `getSection`.
- `addComponents(input, step=5)` → auto-row grouping for buttons/selects.
- `send(messageResolvable, { mentions=false })` → POST message.
- `edit(messageResolvable?)` → PATCH last / given message.
- `reply(messageResolvable, { mention=false, failIfNotExists=false })` → reply referencing a message.

### 8. Buttons & Select Menus
Buttons normalize both REST & discord.js styles:
```js
section.addButton({ style: 'PRIMARY', label: 'Click', custom_id: 'btn_1' });
section.addButton({ style: 5, label: 'Docs', url: 'https://example.com' });
```
Select menu example:
```js
panel.addComponents({
  type: 3,
  custom_id: 'choose',
  options: [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Beta', value: 'beta', description: 'Second choice' }
  ],
  placeholder: 'Choose one'
});
```

### 9. Editing Flow
```js
const msg = await panel.send(channelId);
panel.addLine().addContent('Extra line after send');
await panel.edit(msg);
```

### 10. Error Handling
Throws descriptive errors (invalid color, missing URL for LINK button, etc.). Example:
```js
try { panel.setColor('BAD'); } catch (e) { console.warn('Color fallback', e.message); }
```

### 11. Notes
- Auto `custom_id` pattern: `auto_<timestamp>_<random>`.
- Mentions suppressed by default (`allowed_mentions.parse = []`).
- All component arrays live under one container object.

### 12. Minimal One-Liner Pattern
```js
await new ACARDJSComponentsV2(client)
  .setContainer()
  .setColor('random')
  .addContent('Hello')
  .addLine()
  .addContent('World')
  .send(channelId);
```

---
## Türkçe

### 1. Genel Bakış
`ACARDJSComponentsV2`, Discord'a panel tarzı ham komponent mesajları oluşturmayı kolaylaştıran küçük bir yardımcı sınıftır. Container, bölüm (section), buton, select menü, medya, bölücü ve metin düğümlerini zincirlenebilir metotlarla ekleyip REST üzerinden gönderir. discord.js v13 veya v14 `Client` örneğinizi kullanır.

### 2. Gereksinimler
- Node.js >= 16 (18+ önerilir — native `fetch` içerir)
- discord.js v13 / v14 Client
- Node <18 ise: `npm install node-fetch`

### 3. Kurulum
```bash
npm install node-fetch
```
Kullanım:
```js
const ACARDJSComponentsV2 = require('./index.js');
```
Opsiyonel takma ad:
```js
const createPanel = ACARDJSComponentsV2;
```

### 4. Hızlı Başlangıç (discord.js v14 Örneği)
```js
const { Client, GatewayIntentBits } = require('discord.js');
const ACARDJSComponentsV2 = require('./index.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('messageCreate', async (message) => {
  if (message.content === '!panel') {
    const p = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('random') // veya '#5865F2'
      .addContent(`-# ${message.guild.name}`)
      .addLine()
      .addContent(['Bilgi 1','Bilgi 2'].map(x => `-# ${x}`).join('\n'));

    const gonderilen = await p.send(message.channel.id);

    p.addLine().addContent('Panel güncellendi');
    await p.edit(gonderilen);
  }
});

client.login(process.env.BOT_TOKEN);
```

#### 4.1 discord.js v13 Karşılığı
Aşağıda aynı mantığın v13 için uyarlanmış hali (fark: `Intents.FLAGS` kullanımı ve import):
```js
const { Client, Intents } = require('discord.js');
const ACARDJSComponentsV2 = require('./index.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

client.on('messageCreate', async (message) => {
  if (message.content === '!panel') {
    const p = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('random')
      .addContent(`-# ${message.guild.name}`)
      .addLine()
      .addContent(['Bilgi 1','Bilgi 2'].map(x => `-# ${x}`).join('\n'));

    const gonderilen = await p.send(message.channel.id);
    p.addLine().addContent('Panel güncellendi');
    await p.edit(gonderilen);
  }
});

client.login(process.env.BOT_TOKEN);
```

### 5. Cevap (Reply) Örneği
```js
client.on('messageCreate', async (message) => {
  if (message.content === '!cevappanel') {
    const cevap = new ACARDJSComponentsV2(client)
      .setContainer()
      .setColor('#ff9900')
      .addContent('Cevap Panel Başlığı')
      .addLine()
      .addContent('Detay satırı');

    await cevap.reply(message, { mention: false });
  }
});
```

### 6. Renk Kullanımı
- `'random'`
- Hex: `#5865F2`, `5865F2`, `0x5865F2`
- Sayı: `0x5865F2`
Geçersiz formatta hata fırlatır.

### 7. Temel Metodlar
- `setContainer()` → kök container.
- `setColor(value)` → `accent_color` ayarı.
- `addContent(text)` → metin komponenti.
- `addLine(divider, spacing)` → bölücü.
- `addMedia(liste)` → medya bloğu.
- `addSection({ texts, accessory })` → bölüm + zincir metotları.
- `addComponents(input, step)` → buton / select satır gruplama.
- `send(resolvable, { mentions })` → gönder.
- `edit(resolvable?)` → düzenle.
- `reply(resolvable, { mention, failIfNotExists })` → cevapla.

### 8. Buton & Select Menüsü
```js
section.addButton({ style: 'PRIMARY', label: 'Tıkla', custom_id: 'btn1' });
section.addButton({ style: 5, label: 'Site', url: 'https://example.com' });
```
Select:
```js
p.addComponents({
  type: 3,
  custom_id: 'secim',
  options: [
    { label: 'Bir', value: 'bir' },
    { label: 'İki', value: 'iki', description: 'İkinci seçenek' }
  ],
  placeholder: 'Seçiniz'
});
```

### 9. Düzenleme Akışı
```js
const msg = await p.send(channelId);
p.addLine().addContent('Ek satır');
await p.edit(msg);
```

### 10. Hata Yönetimi
```js
try { p.setColor('yanlis'); } catch (e) { console.warn('Renk hatası', e.message); }
```

### 11. Notlar
- Otomatik `custom_id` kalıbı: `auto_<timestamp>_<random>`.
- Varsayılan menton kapalı (`allowed_mentions.parse = []`).
- Bütün komponentler tek container altında tutulur.

### 12. Minimal Örnek
```js
await new ACARDJSComponentsV2(client)
  .setContainer()
  .setColor('random')
  .addContent('Merhaba')
  .addLine()
  .addContent('Dünya')
  .send(channelId);
```

---
## License / Lisans
Add your license here (e.g. MIT / Apache-2.0). Şu an belirtilmedi.

---
Contributions / Katkılar welcome. Feel free to adapt naming (`createPanel`) or integrate deeper with discord.js structures.
