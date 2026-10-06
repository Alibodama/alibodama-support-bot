# 🤖 Alibodama Support Bot

ربات رسمی پشتیبانی Alibodama برای پاسخ‌گویی به مخاطبان، معرفی لینک‌ها و ارسال پیام‌های کاربران به ادمین.

## ✨ امکانات
- /start و منوی حرفه‌ای
- لینک مستقیم یوتیوب، تلگرام و GitHub
- پاسخ‌های خودکار برای سوالات متداول
- دریافت پیام و رسانه کاربران
- ارسال پیام‌های جدید به ادمین
- پاسخ ادمین با دستور /reply USER_ID متن
- ذخیره کاربران و پیام‌ها در SQLite
- Docker آماده اجرا
- تنظیمات از طریق Environment Variables
- بدون قرار دادن توکن داخل سورس

## ⚙️ متغیرهای محیطی
BOT_TOKEN = توکن BotFather
ADMIN_CHAT_ID = آیدی عددی چت ادمین
CHANNEL_URL = لینک کانال
YOUTUBE_URL = لینک یوتیوب
GITHUB_URL = لینک GitHub
DATABASE_PATH = مسیر دیتابیس

## 🚀 اجرای محلی
1. Python 3.12+ نصب کنید.
2. pip install -r requirements.txt
3. متغیرهای .env را تنظیم کنید.
4. python bot.py

## 🔐 امنیت
توکن ربات را داخل GitHub یا کد پروژه Commit نکنید. آن را به عنوان Secret/Environment Variable سرویس Deploy قرار دهید.

## English
Official Alibodama Telegram support bot with automatic replies, FAQ, user-to-admin support forwarding, admin replies, SQLite storage and Docker deployment.
