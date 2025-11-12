import { Telegraf } from "telegraf";
import postgres from "postgres";

const bot = new Telegraf(process.env.BOT_TOKEN);
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

// 💫 смайлики-вкладки из твоего планера
const EMOJIS = [
  "😀","😁","😂","🥰","😊","😎","🤔","🙌","✨","🔥",
  "✅","📌","⭐","🍀","🌟","⚡","🎯","📚","💡","🧘‍♀️",
  "🏃‍♀️","☕","🍎","🗓️"
];
const DEF = "📌"; // без смайлика — кладём во "Входящие"

// 🧩 регулярное выражение для распознавания смайлика в начале сообщения
const re = new RegExp(`^(${EMOJIS.map(e => e.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')).join("|")})\\s*(.+)$`);

bot.on("text", async (ctx) => {
  const s = (ctx.message.text || "").trim();
  let emoji = DEF, text = s;
  const m = s.match(re);
  if (m) {
    emoji = m[1];
    text = m[2];
  }

  // запись задачи в Supabase
  await sql/*sql*/`
    insert into tasks(text, category_emoji, status, source, chat_id, message_id)
    values(${text}, ${emoji}, 'open', 'telegram', ${ctx.chat.id}, ${ctx.message.message_id})
    on conflict (chat_id, message_id) do nothing;
  `;

  await ctx.reply(`👍 Задача добавлена в ${emoji}: ${text}`);
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    await bot.handleUpdate(req.body);
    return res.status(200).send("ok");
  }
  return res.status(200).send("use POST");
}
