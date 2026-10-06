# 🤖 Alibodama Support Bot — Cloudflare Edition

ربات پشتیبانی رسمی Alibodama که برای **Cloudflare Workers + D1 + KV** آماده شده است.

## ✨ امکانات

- ⚡ اجرا روی Cloudflare Workers بدون VPS
- 📦 ذخیره کاربران و پیام‌ها در Cloudflare D1
- 🧠 نگهداری وضعیت پاسخ ادمین با Cloudflare KV
- 📩 ارسال خودکار پیام کاربران به ادمین
- 💬 پاسخ سریع ادمین با دکمه «پاسخ به کاربر»
- 🔒 بستن تیکت
- 📊 دستورهای `/stats` و `/users`
- ❓ FAQ و منوی دکمه‌ای
- 📺 لینک یوتیوب، 📢 کانال تلگرام و 💻 GitHub
- 🛡️ محافظت Webhook با `secret_token`
- 🌐 مناسب Webhook و اجرای Serverless
- 🐘 بدون نیاز به SQLite یا VPS

## 🏗️ ساختار

```
.
├── src/
│   └── index.js
├── schema.sql
├── wrangler.jsonc
├── package.json
├── .dev.vars.example
└── README.md
```

## ☁️ Cloudflare

این نسخه از D1 و KV استفاده می‌کند. Cloudflare رسماً امکان اتصال Worker به D1/KV از طریق bindings را فراهم می‌کند و Wrangler می‌تواند منابع لازم را هنگام Deploy provision کند. citeturn0search0turn0search2

### Secretهای لازم

در Cloudflare این دو Secret را تعریف کن:

```
BOT_TOKEN=توکن جدید BotFather
WEBHOOK_SECRET=یک مقدار تصادفی قوی
```

و این مقدار از قبل در `wrangler.jsonc` تنظیم شده:

```
ADMIN_CHAT_ID=6804185478
```

**توکن Telegram را داخل GitHub commit نکن.**

## 🗄️ D1

ساختار دیتابیس در `schema.sql` قرار دارد:

- `users`
- `messages`
- `tickets`

D1 از SQL/SQLite استفاده می‌کند و Worker از binding با نام `DB` به دیتابیس دسترسی دارد. citeturn0search0turn0search4

## 🔑 KV

KV با binding به نام `KV` استفاده می‌شود تا وضعیت «پاسخ دادن ادمین به یک کاربر» موقتاً ذخیره شود. Cloudflare KV برای داده‌های key-value و binding داخل Worker طراحی شده است. citeturn0search7

## 🚀 Deploy

بعد از اتصال Cloudflare به پروژه:

```bash
npm install
npx wrangler deploy
npx wrangler d1 execute alibodama-support-db --remote --file=./schema.sql
```

Cloudflare برای D1 امکان اجرای schema روی دیتابیس Remote را با Wrangler فراهم می‌کند. citeturn0search0

## 🔐 تنظیم Webhook

بعد از Deploy، آدرس Worker را به‌عنوان Webhook ربات ثبت کن:

```
https://YOUR-WORKER.workers.dev/telegram/webhook
```

Webhook باید HTTPS باشد و Telegram از طریق `setWebhook` آپدیت‌ها را به Worker ارسال می‌کند. همچنین `secret_token` باعث می‌شود Worker فقط درخواست‌هایی را که Secret درست دارند قبول کند. citeturn1search0turn1search1

## 👨‍💻 دستورات ادمین

```
/reply USER_ID متن پاسخ
/stats
/users
/cancel
```

همچنین هنگام دریافت پیام جدید، ربات برای ادمین دکمه **💬 پاسخ به کاربر** نمایش می‌دهد؛ با زدن آن، پیام بعدی ادمین مستقیماً برای همان کاربر ارسال می‌شود.

## ⚠️ امنیت

توکن ربات را در GitHub، README، کد یا پیام عمومی قرار نده. Telegram هم تأکید می‌کند که هر کسی توکن BotFather را داشته باشد می‌تواند کنترل کامل ربات را در اختیار بگیرد. citeturn1search8

اگر توکن قبلی در جایی عمومی شده، از BotFather آن را باطل و یک توکن جدید ایجاد کن.

## 🇬🇧 English

Cloudflare Workers based Telegram support bot for Alibodama with D1 database, KV state storage, webhook security, automatic user-to-admin forwarding, admin replies, FAQ, statistics and GitHub/YouTube/Telegram links.
