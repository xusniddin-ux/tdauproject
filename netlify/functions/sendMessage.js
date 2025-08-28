// netlify/functions/sendMessage.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const body = JSON.parse(event.body);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // --- 2-Holat: Telegramdan tugma bosish so'rovi (Callback Query) keldi ---
  if (body.callback_query) {
    const callbackQuery = body.callback_query;
    const message = callbackQuery.message;
    const data = callbackQuery.data; // Tugmadan kelgan ma'lumot, masalan: "status_contacted"

    // Mavjud xabar matnini olamiz
    const originalText = message.text;
    let newText = originalText;

    // Faqat "Status" qatorini o'zgartiramiz
    if (data === 'status_new') {
      newText = originalText.replace(/Status: .*/g, 'Status: ✅ Yangi');
    } else if (data === 'status_contacted') {
      newText = originalText.replace(/Status: .*/g, "Status: 📞 Bog'lanildi");
    } else if (data === 'status_rejected') {
      newText = originalText.replace(/Status: .*/g, 'Status: ❌ Rad etildi');
    }

    // Xabarni yangi matn bilan tahrirlaymiz
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        message_id: message.message_id,
        text: newText,
        parse_mode: 'Markdown',
        reply_markup: message.reply_markup,
      }),
    });

    // Telegramga so'rov qabul qilinganini bildiramiz
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Callback received' }),
    };
  }

  // --- 1-Holat: Saytdan yangi ariza keldi ---
  else {
    const { name, phone, age, telegram } = body;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Yangi', callback_data: 'status_new' },
          { text: "📞 Bog'lanildi", callback_data: 'status_contacted' },
          { text: '❌ Rad etildi', callback_data: 'status_rejected' },
        ],
      ],
    };

    const messageText = `
📢 Yangi Ariza!

👤 Ism: *${name}*
📞 Telefon: \`${phone}\`
🎂 Yosh: *${age}*
✈️ Telegram: \`${telegram}\`

Status: ✅ Yangi
    `;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Xabar muvaffaqiyatli yuborildi!' }),
    };
  }
};
