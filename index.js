const fetch = require("node-fetch");

class ACARDJSComponentsV2 {
    constructor(client) {
        this.client = client;
        this.flags = 32768;
        this.components = [];
    }
    setContainer() {
        const container = { type: 17, components: [] };
        this.components.push(container);
        return container;
    }
    setColor(input) {
        let container = this.components[this.components.length - 1];
        if (!container || container.type !== 17) container = this.setContainer();
        if (input == null) return this;
        if (typeof input === "string" && input.trim().toLowerCase() === "random") {
            container.accent_color = Math.floor(Math.random() * 0x1000000);
            return this;
        }
        let hex = String(input).trim();
        if (typeof input === "number" || /^[0-9]+$/.test(hex)) {
            container.accent_color = (Number(input) & 0xFFFFFF) >>> 0;
            return this;
        }
        if (hex.startsWith("#")) hex = hex.slice(1);
        if (hex.toLowerCase().startsWith("0x")) hex = hex.slice(2);
        if (hex.length === 3 || hex.length === 4) hex = hex.split("").map(c => c + c).join("");
        if (hex.length === 8) hex = hex.slice(0, 6);
        if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error("Geçersiz renk formatı. Örnekler: #5865F2, 5865F2, #7289da, #1c353dff, random");
        container.accent_color = parseInt(hex, 16) & 0xFFFFFF;
        return this;
    }
    addMedia(medias = []) {
        let container = this.components[this.components.length - 1];
        if (this.components.length === 0) this.setContainer();
        if (!container || container.type !== 17) throw new Error("Geçerli bir container bulunamadı / tip 17 değil.");
        const mediaSection = {
            type: 12,
            items: medias.map(m => {
                if (typeof m === "string") return { media: { url: m } };
                if (m.media && m.media.url) return { media: { url: m.media.url } };
                if (m.url) return { media: { url: m.url } };
                if (m.type && m.url) return { media: { url: m.url } };
                return { media: { url: String(m) } };
            })
        };
        container.components.push(mediaSection);
        return mediaSection;
    }
    addSection({ texts = [], accessory = null } = {}) {
        let container = this.components[this.components.length - 1];
        if (this.components.length === 0) container = this.setContainer();
        if (!container || container.type !== 17) throw new Error("Geçerli bir container bulunamadı / tip 17 değil.");
        const section = {
            type: 9,
            components: texts.map(t => typeof t === "string" ? { type: 10, content: t } : { type: 10, content: t.content })
        };
        const convertDiscordButton = (btn) => {
            if (!btn) throw new Error("Buton verisi yok.");
            if (btn.type === 2 && (typeof btn.style === "number" || /^[1-5]$/.test(String(btn.style)))) {
                if (typeof btn.style !== "number") btn.style = Number(btn.style);
                if (btn.style === 5) delete btn.custom_id; else if (!btn.custom_id) btn.custom_id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                return btn;
            }
            const src = btn.data ? btn.data : btn;
            let style = src.style;
            const STYLE_MAP = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4, LINK: 5, BLURPLE: 1, GRAY: 2, GREY: 2, GREEN: 3, RED: 4 };
            if (typeof style === "string") style = STYLE_MAP[style.toUpperCase()] ?? style;
            if (typeof style === "string" && /^[1-5]$/.test(style)) style = Number(style);
            if (style == null) style = src.url ? 5 : 1;
            if (typeof style !== "number" || style < 1 || style > 5) throw new Error("Geçersiz button style.");
            const custom_id = src.customId ?? src.custom_id;
            const url = src.url;
            const label = src.label;
            const disabled = src.disabled;
            const emoji = src.emoji;
            const out = { type: 2, style };
            if (label) out.label = String(label);
            if (emoji) {
                if (typeof emoji === "object") {
                    const e = {};
                    if (emoji.id) e.id = emoji.id;
                    if (emoji.name) e.name = emoji.name;
                    if (typeof emoji.animated === "boolean") e.animated = emoji.animated;
                    if (Object.keys(e).length) out.emoji = e;
                } else if (typeof emoji === "string") out.emoji = { name: emoji };
            }
            if (style === 5) {
                if (!url) throw new Error("LINK (style 5) butonu için url gerekli.");
                out.url = url;
            } else out.custom_id = custom_id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            if (disabled) out.disabled = true;
            return out;
        };
        Object.defineProperties(section, {
            setAccessory: { value: function (acc) { section.accessory = acc; return section; } },
            addButton: { value: function (buttonLike) { const acc = convertDiscordButton(buttonLike); section.accessory = acc; return section; } },
            addImage: { value: function (urlOrObj) { let mediaObj; if (typeof urlOrObj === "string") mediaObj = { type: 11, media: { url: urlOrObj } }; else if (urlOrObj && typeof urlOrObj === "object") { if (urlOrObj.type === 11) mediaObj = urlOrObj; else if (urlOrObj.media && urlOrObj.media.url) mediaObj = { type: 11, media: { url: urlOrObj.media.url } }; else if (urlOrObj.url) mediaObj = { type: 11, media: { url: urlOrObj.url } }; else throw new Error("Geçersiz image objesi."); } else throw new Error("Geçersiz image parametresi."); section.accessory = mediaObj; return section; } },
            getSection: { value: function () { return section; } }
        });
        if (accessory) section.setAccessory(accessory);
        container.components.push(section);
        return section;
    }
    addComponents(input = [], step = 5) {
        let container = this.components[this.components.length - 1];
        if (this.components.length === 0) container = this.setContainer();
        if (!container || container.type !== 17) throw new Error("Geçerli bir container bulunamadı / tip 17 değil.");
        const items = Array.isArray(input) ? input : [input];
        const pushedRows = [];
        for (const item of items) {
            if (item && typeof item === "object" && item.type === 1) {
                const comps = Array.isArray(item.components) ? item.components : [];
                const normalized = comps.map(c => this._normalizeAnyComponent(c)).filter(Boolean).slice(0, step);
                if (!normalized.length) continue;
                const row = { type: 1, components: normalized };
                container.components.push(row);
                pushedRows.push(row);
                continue;
            }
            const comp = this._normalizeAnyComponent(item);
            if (!comp) continue;
            let lastRow = null;
            for (let i = container.components.length - 1; i >= 0; i--) if (container.components[i].type === 1) { lastRow = container.components[i]; break; }
            const isSelect = this._isSelectType(comp.type);
            if (!isSelect && lastRow && lastRow.components.length < step && lastRow.components.every(c => c.type === 2)) {
                lastRow.components.push(comp);
                if (!pushedRows.includes(lastRow)) pushedRows.push(lastRow);
            } else {
                const newRow = { type: 1, components: [comp] };
                container.components.push(newRow);
                pushedRows.push(newRow);
            }
        }
        return pushedRows;
    }
    _normalizeAnyComponent(comp) {
        if (!comp) return null;
        if (typeof comp.toJSON === "function") { try { comp = comp.toJSON(); } catch { return null; } }
        if (comp.type === 2) return this._normalizeButton(comp);
        if (this._isSelectType(comp.type) || comp.options) return this._normalizeSelectMenu(comp);
        return null;
    }
    _isSelectType(t) { return [3, 5, 6, 7, 8].includes(t); }
    _normalizeSelectMenu(menu) {
        if (!menu || typeof menu !== "object") return null;
        const src = menu.data ? menu.data : menu;
        let type = src.type;
        if (!this._isSelectType(type)) { if (src.options) type = 3; else return null; }
        const out = { type };
        const customId = src.custom_id || src.customId;
        out.custom_id = customId || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (src.placeholder) out.placeholder = String(src.placeholder);
        if (typeof src.min_values === "number") out.min_values = src.min_values; else if (typeof src.minValues === "number") out.min_values = src.minValues;
        if (typeof src.max_values === "number") out.max_values = src.max_values; else if (typeof src.maxValues === "number") out.max_values = src.maxValues;
        if (src.disabled) out.disabled = true;
        if (type === 3) {
            const options = src.options || src.data?.options;
            if (!Array.isArray(options) || !options.length) return null;
            out.options = options.slice(0, 25).map(o => {
                const opt = { label: String(o.label ?? "Seçenek"), value: String(o.value ?? o.label ?? "value") };
                if (o.description) opt.description = String(o.description);
                if (o.default) opt.default = true;
                if (o.emoji) {
                    if (typeof o.emoji === "object") {
                        const e = {};
                        if (o.emoji.id) e.id = o.emoji.id;
                        if (o.emoji.name) e.name = o.emoji.name;
                        if (typeof o.emoji.animated === "boolean") e.animated = o.emoji.animated;
                        if (Object.keys(e).length) opt.emoji = e;
                    } else if (typeof o.emoji === "string") opt.emoji = { name: o.emoji };
                }
                return opt;
            });
            if (!out.options.length) return null;
        }
        return out;
    }
    _normalizeButton(btn) {
        if (!btn || typeof btn !== "object") return null;
        if (btn.type === 2 && typeof btn.style === "number") {
            const clone = { ...btn };
            if (clone.style === 5) { if (!clone.url) return null; delete clone.custom_id; }
            else { const cid = clone.custom_id || clone.customId; if (!cid) clone.custom_id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; else if (!clone.custom_id && cid) clone.custom_id = cid; delete clone.customId; }
            return clone;
        }
        const src = btn.data ? btn.data : btn;
        const STYLE_MAP = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4, LINK: 5, BLURPLE: 1, GRAY: 2, GREY: 2, GREEN: 3, RED: 4 };
        let style = src.style;
        if (typeof style === "string") style = STYLE_MAP[style.toUpperCase()] ?? style;
        if (typeof style === "string" && /^[1-5]$/.test(style)) style = Number(style);
        if (style == null) style = src.url ? 5 : 1;
        if (typeof style !== "number" || style < 1 || style > 5) return null;
        const out = { type: 2, style };
        if (src.label) out.label = String(src.label);
        if (src.emoji) {
            if (typeof src.emoji === "object") {
                const e = {};
                if (src.emoji.id) e.id = src.emoji.id;
                if (src.emoji.name) e.name = src.emoji.name;
                if (typeof src.emoji.animated === "boolean") e.animated = src.emoji.animated;
                if (Object.keys(e).length) out.emoji = e;
            } else if (typeof src.emoji === "string") out.emoji = { name: src.emoji };
        }
        if (style === 5) { if (!src.url) return null; out.url = String(src.url); }
        else { const customId = src.custom_id || src.customId; out.custom_id = customId || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
        if (src.disabled) out.disabled = true;
        return out;
    }
    addLine(divider = true, spacing = 0) {
        let container = this.components[this.components.length - 1];
        if (this.components.length === 0) container = this.setContainer();
        if (!container || container.type !== 17) throw new Error("Geçerli bir container bulunamadı / tip 17 değil.");
        const line = { type: 14, divider: Boolean(divider) };
        if (typeof spacing === "number" && spacing > 0) line.spacing = spacing > 2 ? 2 : spacing;
        container.components.push(line);
        return line;
    }
    addContent(text) {
        let container = this.components[this.components.length - 1];
        if (this.components.length === 0) container = this.setContainer();
        if (!container || container.type !== 17) throw new Error("Geçerli bir container bulunamadı / tip 17 değil.");
        const content = { type: 10, content: String(text) };
        container.components.push(content);
        return content;
    }
    buildPayload() { return { flags: this.flags, components: this.components }; }
    async send(messageResolvable, { mentions = false } = {}) {
        if (!messageResolvable) throw new Error("send için messageResolvable gerekli.");
        let channelId = null;
        if (typeof messageResolvable === "object" && messageResolvable) {
            if (messageResolvable.send && messageResolvable.id) channelId = messageResolvable.id; else channelId = messageResolvable.channel?.id || messageResolvable.channel_id || messageResolvable.channelId || null;
        } else if (typeof messageResolvable === "string") channelId = messageResolvable;
        if (!channelId) throw new Error("Kanal ID bulunamadı. Geçerli bir messageResolvable verin.");
        const body = this.buildPayload();
        if (!mentions) body.allowed_mentions = { parse: [] };
        if (!this.client) this.client = messageResolvable.client;
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { "Authorization": `Bot ${this.client.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const raw = await res.text().catch(() => "");
        if (!res.ok) throw new Error(`Discord API hata: ${res.status} ${raw}`);
        let data; try { data = JSON.parse(raw); } catch { throw new Error("API yanıtı JSON parse edilemedi."); }
        this._lastMessage = { id: data.id, channel_id: data.channel_id || channelId };
        try {
            const channel = (typeof messageResolvable === "object" && messageResolvable?.send) ? messageResolvable : await this.client.channels.fetch(channelId);
            if (channel && channel.messages && data.id) {
                const msg = await channel.messages.fetch(data.id).catch(() => null);
                if (msg) { this._lastMessage.message = msg; return msg; }
            }
        } catch {}
        return data;
    }
    async edit(messageResolvable) {
        let channelId = null; let messageId = null;
        if (!messageResolvable) { if (!this._lastMessage) throw new Error("edit için önce send çağırılmalı."); channelId = this._lastMessage.channel_id; messageId = this._lastMessage.id; }
        else if (typeof messageResolvable === "string") { if (!this._lastMessage?.channel_id) throw new Error("Önceki channel bilgisi yok."); channelId = this._lastMessage.channel_id; messageId = messageResolvable; }
        else if (typeof messageResolvable === "object") { messageId = messageResolvable.id; channelId = messageResolvable.channel?.id || messageResolvable.channel_id || messageResolvable.channelId || this._lastMessage?.channel_id || null; }
        if (!channelId || !messageId) throw new Error("edit için channelId veya messageId yok.");
        const body = this.buildPayload();
        body.allowed_mentions = { parse: [] };
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, { method: "PATCH", headers: { "Authorization": `Bot ${this.client.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const raw = await res.text().catch(() => "");
        if (!res.ok) throw new Error(`Discord API hata (edit): ${res.status} ${raw}`);
        let data; try { data = JSON.parse(raw); } catch { throw new Error("Edit yanıtı JSON parse edilemedi."); }
        this._lastMessage = { id: data.id, channel_id: data.channel_id || channelId };
        try {
            if (this._lastMessage.message && this._lastMessage.message.edit) {
                const channel = this._lastMessage.message.channel;
                const msg = await channel.messages.fetch(data.id).catch(() => null);
                if (msg) { this._lastMessage.message = msg; return msg; }
            } else {
                const channel = await this.client.channels.fetch(channelId).catch(() => null);
                if (channel?.messages) {
                    const msg = await channel.messages.fetch(data.id).catch(() => null);
                    if (msg) { this._lastMessage.message = msg; return msg; }
                }
            }
        } catch {}
        return data;
    }
    async reply(messageResolvable, { mention = false, failIfNotExists = false } = {}) {
        if (!messageResolvable) throw new Error("Reply için messageResolvable gerekli.");
        const messageId = typeof messageResolvable === "string" ? messageResolvable : messageResolvable.id;
        const channelId = (messageResolvable.channel && messageResolvable.channel.id) || messageResolvable.channel_id || messageResolvable.channelId;
        if (!channelId) throw new Error("Mesajın kanal ID'si bulunamadı.");
        const guildId = messageResolvable.guild?.id || messageResolvable.guild_id || messageResolvable.guildId || undefined;
        const body = this.buildPayload();
        body.message_reference = { message_id: messageId, channel_id: channelId };
        if (guildId) body.message_reference.guild_id = guildId;
        body.allowed_mentions = { parse: [], replied_user: Boolean(mention) };
        if (failIfNotExists) body.fail_if_not_exists = true;
        if (!this.client) this.client = messageResolvable.client;
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { "Authorization": `Bot ${this.client.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const raw = await res.text().catch(() => "");
        if (!res.ok) throw new Error(`Discord API hata: ${res.status} ${raw}`);
        let data; try { data = JSON.parse(raw); } catch { throw new Error("API yanıtı JSON parse edilemedi."); }
        try {
            const channel = messageResolvable.channel && messageResolvable.channel.messages ? messageResolvable.channel : await this.client.channels.fetch(channelId);
            if (channel && channel.messages && data.id) {
                const msg = await channel.messages.fetch(data.id).catch(() => null);
                if (msg) return msg;
            }
        } catch {}
        return data;
    }
}
module.exports = ACARDJSComponentsV2;
