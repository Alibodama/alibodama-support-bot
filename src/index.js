const CHANNEL_URL = "https://t.me/alibodama";
const YOUTUBE_URL = "https://youtube.com/@alibodama";
const GITHUB_URL = "https://github.com/Alibodama";

const WELCOME = `سلام 👋
به ربات پشتیبانی رسمی Alibodama خوش اومدی.

از منوی زیر می‌تونی کانال، یوتیوب و پروژه‌های گیت‌هاب رو ببینی یا سوالت رو برای پشتیبانی بفرستی.

💬 درباره نصب، پنل‌ها، پروژه‌ها، آموزش‌ها و خطاهای فنی سوال داری؟ همینجا پیام بده.`;

const FAQ = `❓ سوالات متداول

🔹 پروژه‌ها و سورس‌ها → 💻 گیت‌هاب
🔹 آموزش‌ها → 📺 یوتیوب
🔹 مشکل نصب یا اجرا → نام پروژه + متن کامل خطا + کاری که انجام دادی را بفرست.
🔹 اگر جواب سوالت اینجا نبود، پیام را برای پشتیبانی ارسال کن.`;

function keyboard() {
  return {
    inline_keyboard: [
      [{text:"📺 یوتیوب",url:YOUTUBE_URL},{text:"📢 کانال تلگرام",url:CHANNEL_URL}],
      [{text:"💻 گیت‌هاب",url:GITHUB_URL}],
      [{text:"❓ سوالات متداول",callback_data:"faq"}],
      [{text:"👨‍💻 ارتباط با پشتیبانی",callback_data:"support"}]
    ]
  };
}

async function telegram(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
  return res.json();
}

async function saveUser(env, user) {
  await env.DB.prepare(`
    INSERT INTO users(id, username, first_name, last_name, created_at, last_seen)
    VALUES(?,?,?,?,datetime('now'),datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      last_seen=datetime('now')
  `).bind(
    user.id, user.username || null, user.first_name || null, user.last_name || null
  ).run();
}

async function saveMessage(env, userId, direction, text) {
  await env.DB.prepare(
    "INSERT INTO messages(user_id,direction,text,created_at) VALUES(?,?,?,datetime('now'))"
  ).bind(userId, direction, text || "[media]").run();
}

async function notifyAdmin(env, message, text) {
  const user = message.from;
  const info =
    `📩 پیام جدید پشتیبانی

👤 ${user.first_name || ""} ${user.last_name || ""}
🆔 ${user.id}
🔗 @${user.username || "بدون یوزرنیم"}

📝 ${text}

برای پاسخ روی دکمه زیر بزنید یا:
 /reply ${user.id} متن پاسخ`;

  await telegram(env, "sendMessage", {
    chat_id: env.ADMIN_CHAT_ID,
    text: info,
    reply_markup: {
      inline_keyboard: [
        [{text:"💬 پاسخ به کاربر", callback_data:`reply:${user.id}`}],
        [{text:"🔒 بستن تیکت", callback_data:`close:${user.id}`}]
      ]
    }
  });

  if (message.photo || message.document || message.video || message.voice || message.audio || message.sticker) {
    await telegram(env, "forwardMessage", {
      chat_id: env.ADMIN_CHAT_ID,
      from_chat_id: message.chat.id,
      message_id: message.message_id
    });
  }
}

async function handleUserMessage(env, message) {
  const user = message.from;
  await saveUser(env, user);

  const text = message.text || message.caption || "[رسانه]";
  await saveMessage(env, user.id, "user", text);

  const lower = text.toLowerCase();

  if (message.text === "/start") {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text: WELCOME,
      reply_markup: keyboard()
    });
    return;
  }

  if (message.text === "/help") {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text: FAQ,
      reply_markup: keyboard()
    });
    return;
  }

  if (/(سلام|درود|hello|hi)/i.test(lower)) {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text:"سلام 👋 سوالت رو بفرست؛ در خدمتم."
    });
    return;
  }

  if (/(github|گیت.?هاب|سورس|پروژه)/i.test(lower)) {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text:`💻 گیت‌هاب Alibodama:
${GITHUB_URL}`
    });
    return;
  }

  if (/(یوتیوب|youtube|ویدیو|آموزش)/i.test(lower)) {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text:`📺 یوتیوب Alibodama:
${YOUTUBE_URL}`
    });
    return;
  }

  if (/(کانال|تلگرام|telegram)/i.test(lower)) {
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text:`📢 کانال تلگرام:
${CHANNEL_URL}`
    });
    return;
  }

  if (Number(message.chat.id) !== Number(env.ADMIN_CHAT_ID)) {
    await notifyAdmin(env, message, text);
    await telegram(env, "sendMessage", {
      chat_id: message.chat.id,
      text:"✅ پیامت دریافت شد و برای پشتیبانی ارسال شد. به‌زودی پاسخ می‌دیم."
    });
  }
}

async function handleAdminCommand(env, message) {
  if (Number(message.chat.id) !== Number(env.ADMIN_CHAT_ID)) return false;

  const text = message.text || "";

  if (text.startsWith("/reply ")) {
    const parts = text.split(" ");
    const userId = Number(parts[1]);
    const reply = parts.slice(2).join(" ").trim();

    if (!userId || !reply) {
      await telegram(env,"sendMessage",{chat_id:message.chat.id,text:"فرمت: /reply USER_ID متن پاسخ"});
      return true;
    }

    await telegram(env,"sendMessage",{
      chat_id:userId,
      text:"👨‍💻 پاسخ پشتیبانی:\n\n" + reply
    });
    await saveMessage(env,userId,"admin",reply);
    await telegram(env,"sendMessage",{chat_id:message.chat.id,text:"✅ پاسخ ارسال شد."});
    return true;
  }

  if (text === "/stats") {
    const users = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
    const messages = await env.DB.prepare("SELECT COUNT(*) AS n FROM messages").first();
    await telegram(env,"sendMessage",{
      chat_id:message.chat.id,
      text:`📊 آمار ربات

👥 کاربران: ${users?.n || 0}
💬 پیام‌ها: ${messages?.n || 0}`
    });
    return true;
  }

  if (text === "/users") {
    const rows = await env.DB.prepare(
      "SELECT id, username, first_name, last_seen FROM users ORDER BY last_seen DESC LIMIT 20"
    ).all();
    const list = (rows.results || []).map(
      r => `• ${r.first_name || ""} @${r.username || "-"} — ${r.id}`
    ).join("\n") || "کاربری ثبت نشده.";
    await telegram(env,"sendMessage",{chat_id:message.chat.id,text:"👥 آخرین کاربران:\n\n"+list});
    return true;
  }

  return false;
}

async function handleCallback(env, callback) {
  const data = callback.data || "";
  const adminId = Number(callback.from.id);
  if (adminId !== Number(env.ADMIN_CHAT_ID)) {
    await telegram(env,"answerCallbackQuery",{callback_query_id:callback.id,text:"دسترسی ندارید.",show_alert:true});
    return;
  }

  if (data === "faq") {
    await telegram(env,"answerCallbackQuery",{callback_query_id:callback.id});
    await telegram(env,"editMessageText",{
      chat_id:callback.message.chat.id,
      message_id:callback.message.message_id,
      text:FAQ,
      reply_markup:keyboard()
    });
    return;
  }

  if (data === "support") {
    await telegram(env,"answerCallbackQuery",{callback_query_id:callback.id});
    await telegram(env,"sendMessage",{chat_id:callback.message.chat.id,text:"📝 پیام یا فایل خودت رو همینجا بفرست."});
    return;
  }

  if (data.startsWith("reply:")) {
    const userId = data.split(":")[1];
    await env.KV.put(`admin:reply_target:${adminId}`, userId, {expirationTtl: 3600});
    await telegram(env,"answerCallbackQuery",{callback_query_id:callback.id,text:"حالت پاسخ فعال شد."});
    await telegram(env,"sendMessage",{chat_id:callback.message.chat.id,text:`✍️ حالا پاسخ را بفرست. این پیام برای کاربر ${userId} ارسال می‌شود.\nبرای لغو /cancel را بفرست.`});
    return;
  }

  if (data.startsWith("close:")) {
    const userId = data.split(":")[1];
    await env.DB.prepare(
      "INSERT INTO tickets(user_id,status,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET status='closed',updated_at=datetime('now')"
    ).bind(Number(userId),"closed").run();
    await telegram(env,"answerCallbackQuery",{callback_query_id:callback.id,text:"تیکت بسته شد."});
  }
}

async function handleAdminMessage(env, message) {
  if (Number(message.chat.id) !== Number(env.ADMIN_CHAT_ID)) return false;

  const text = message.text || message.caption || "";
  const target = await env.KV.get(`admin:reply_target:${env.ADMIN_CHAT_ID}`);

  if (target && text !== "/cancel" && !text.startsWith("/reply ") && !text.startsWith("/stats") && !text.startsWith("/users")) {
    await telegram(env,"sendMessage",{
      chat_id:Number(target),
      text:"👨‍💻 پاسخ پشتیبانی:\n\n" + text
    });
    await saveMessage(env,Number(target),"admin",text);
    await env.KV.delete(`admin:reply_target:${env.ADMIN_CHAT_ID}`);
    await telegram(env,"sendMessage",{chat_id:message.chat.id,text:"✅ پاسخ ارسال شد."});
    return true;
  }

  if (text === "/cancel") {
    await env.KV.delete(`admin:reply_target:${env.ADMIN_CHAT_ID}`);
    await telegram(env,"sendMessage",{chat_id:message.chat.id,text:"❌ پاسخ لغو شد."});
    return true;
  }

  return handleAdminCommand(env,message);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Alibodama Support Bot is running.");
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ok:true,service:"alibodama-support-bot"});
    }

    if (request.method !== "POST" || url.pathname !== "/telegram/webhook") {
      return new Response("Not Found", {status:404});
    }

    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
      return new Response("Unauthorized", {status:401});
    }

    try {
      const update = await request.json();

      if (update.callback_query) {
        await handleCallback(env, update.callback_query);
      } else if (update.message) {
        if (Number(update.message.chat.id) === Number(env.ADMIN_CHAT_ID)) {
          await handleAdminMessage(env, update.message);
        } else {
          await handleUserMessage(env, update.message);
        }
      }

      return Response.json({ok:true});
    } catch (error) {
      console.error(error);
      return Response.json({ok:false}, {status:500});
    }
  }
};
