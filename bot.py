import asyncio
import logging
import os
import sqlite3
from datetime import datetime
from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import Message, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder

TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "0"))
CHANNEL_URL = os.getenv("CHANNEL_URL", "https://t.me/alibodama")
YOUTUBE_URL = os.getenv("YOUTUBE_URL", "https://youtube.com/@alibodama")
GITHUB_URL = os.getenv("GITHUB_URL", "https://github.com/Alibodama")
if not TOKEN:
    raise RuntimeError("BOT_TOKEN is not set")

logging.basicConfig(level=logging.INFO)
bot = Bot(TOKEN)
dp = Dispatcher()
db = sqlite3.connect(os.getenv("DATABASE_PATH", "support.db"), check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT, first_name TEXT, last_name TEXT, created_at TEXT, last_seen TEXT)")
db.execute("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, direction TEXT, text TEXT, created_at TEXT)")
db.commit()

def save_user(m):
    now = datetime.utcnow().isoformat()
    db.execute("""INSERT INTO users(id,username,first_name,last_name,created_at,last_seen)
    VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET username=excluded.username,
    first_name=excluded.first_name,last_name=excluded.last_name,last_seen=excluded.last_seen""",
    (m.from_user.id,m.from_user.username,m.from_user.first_name,m.from_user.last_name,now,now))
    db.commit()

def menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="📺 یوتیوب", url=YOUTUBE_URL)
    kb.button(text="📢 کانال تلگرام", url=CHANNEL_URL)
    kb.button(text="💻 گیت‌هاب", url=GITHUB_URL)
    kb.button(text="❓ سوالات متداول", callback_data="faq")
    kb.button(text="👨‍💻 ارتباط با پشتیبانی", callback_data="support")
    kb.adjust(2,2,1)
    return kb.as_markup()

WELCOME = """سلام 👋
به ربات پشتیبانی رسمی Alibodama خوش اومدی.

از منوی زیر می‌تونی کانال، یوتیوب و پروژه‌های گیت‌هاب رو ببینی یا سوالت رو برای پشتیبانی بفرستی.

💬 هر سوالی درباره پروژه‌ها، پنل‌ها، آموزش‌ها، نصب، خطاها یا مشکلات فنی داری همینجا پیام بده."""

FAQ = """❓ سوالات متداول

🔹 لینک پروژه‌ها و سورس‌ها: از بخش «گیت‌هاب» استفاده کن.
🔹 آموزش‌های ویدیویی: از بخش «یوتیوب» وارد کانال شو.
🔹 مشکل نصب یا اجرا: نام پروژه + متن کامل خطا + کاری که انجام دادی رو بفرست.
🔹 سوالی داری که اینجا جوابش نبود؟ روی «ارتباط با پشتیبانی» بزن."""

@dp.message(CommandStart())
async def start(m: Message):
    save_user(m)
    await m.answer(WELCOME, reply_markup=menu())

@dp.callback_query(F.data=="faq")
async def faq(c: CallbackQuery):
    await c.answer()
    await c.message.edit_text(FAQ, reply_markup=menu())

@dp.callback_query(F.data=="support")
async def support(c: CallbackQuery):
    await c.answer()
    await c.message.answer("📝 پیامت رو همینجا بفرست. اگر خطاست، متن کامل خطا یا اسکرین‌شاتش رو هم ارسال کن.")

@dp.message(Command("help"))
async def help_cmd(m: Message):
    save_user(m)
    await m.answer(FAQ, reply_markup=menu())

@dp.message(Command("reply"))
async def admin_reply(m: Message):
    if m.chat.id != ADMIN_CHAT_ID:
        return
    parts = m.text.split(maxsplit=2)
    if len(parts) < 3:
        await m.answer("فرمت: /reply USER_ID متن پاسخ")
        return
    try:
        uid = int(parts[1])
    except ValueError:
        await m.answer("USER_ID باید عدد باشد.")
        return
    text = parts[2]
    await bot.send_message(uid, "👨‍💻 پاسخ پشتیبانی:\n\n" + text)
    db.execute("INSERT INTO messages(user_id,direction,text,created_at) VALUES(?,?,?,?)",
               (uid,"admin",text,datetime.utcnow().isoformat()))
    db.commit()
    await m.answer("✅ پاسخ ارسال شد.")

@dp.message()
async def incoming(m: Message):
    save_user(m)
    text = m.text or m.caption or "[فایل/رسانه]"
    db.execute("INSERT INTO messages(user_id,direction,text,created_at) VALUES(?,?,?,?)",
               (m.from_user.id,"user",text,datetime.utcnow().isoformat()))
    db.commit()

    if m.chat.id == ADMIN_CHAT_ID:
        return

    if m.text:
        t = m.text.lower()
        if any(x in t for x in ("سلام","درود","hello","hi")):
            await m.answer("سلام 👋 سوالت رو بفرست؛ در خدمتم.")
            return
        if any(x in t for x in ("github","گیت هاب","گیتهاب","لینک گیت")):
            await m.answer("💻 گیت‌هاب Alibodama:\n" + GITHUB_URL)
            return
        if any(x in t for x in ("یوتیوب","youtube")):
            await m.answer("📺 یوتیوب Alibodama:\n" + YOUTUBE_URL)
            return
        if any(x in t for x in ("کانال","تلگرام","telegram")):
            await m.answer("📢 کانال تلگرام:\n" + CHANNEL_URL)
            return

    if ADMIN_CHAT_ID:
        user = m.from_user
        info = ("📩 پیام جدید پشتیبانی\n\n👤 " + user.full_name +
                "\n🆔 " + str(user.id) +
                "\n🔗 @" + (user.username or "بدون یوزرنیم") +
                "\n\n" + text +
                "\n\nبرای پاسخ:\n/reply " + str(user.id) + " متن پاسخ")
        try:
            await bot.send_message(ADMIN_CHAT_ID, info)
            if m.content_type != "text":
                await m.copy_to(ADMIN_CHAT_ID)
        except Exception:
            logging.exception("Failed to notify admin")
    await m.answer("✅ پیامت دریافت شد و برای پشتیبانی ارسال شد. به‌زودی پاسخ می‌دیم.")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
