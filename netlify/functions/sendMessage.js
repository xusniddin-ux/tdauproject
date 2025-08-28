// netlify/functions/sendMessage.js

const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log('Event method:', event.httpMethod);
  console.log('Event body:', event.body);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // CORS headers qo'shish
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // OPTIONS so'rovini qaytarish
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // --- Telegramdan kelgan callback query'ni qayta ishlash ---
    if (body.callback_query) {
      console.log('Callback query received:', body.callback_query);

      const callbackQuery = body.callback_query;
      const message = callbackQuery.message;
      const data = callbackQuery.data;
      const callbackQueryId = callbackQuery.id;

      // Avval callback query'ga javob beramiz
      await fetch(
        `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: 'Status yangilandi!',
          }),
        },
      );

      // Mavjud xabar matnini olamiz
      const originalText = message.text;
      let newText = originalText;

      // Status qatorini o'zgartiramiz
      if (data === 'status_new') {
        newText = originalText.replace(/Status: .*/g, 'Status: ✅ Yangi');
      } else if (data === 'status_contacted') {
        newText = originalText.replace(/Status: .*/g, "Status: 📞 Bog'lanildi");
      } else if (data === 'status_rejected') {
        newText = originalText.replace(/Status: .*/g, 'Status: ❌ Rad etildi');
      }

      // Inline keyboard'ni saqlash
      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yangi', callback_data: 'status_new' },
            { text: "📞 Bog'lanildi", callback_data: 'status_contacted' },
            { text: '❌ Rad etildi', callback_data: 'status_rejected' },
          ],
        ],
      };

      // Xabarni yangilash
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chat.id,
          message_id: message.message_id,
          text: newText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        }),
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Callback processed successfully' }),
      };
    }

    // --- Saytdan yangi ariza ---
    else if (body.name && body.phone) {
      console.log('New application received:', body);

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

      const messageText = `📢 Yangi Ariza!

👤 Ism: *${name}*
📞 Telefon: \`${phone}\`
🎂 Yosh: *${age}*
✈️ Telegram: \`${telegram}\`

Status: ✅ Yangi`;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API error:', errorText);
        throw new Error('Telegram API error');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Xabar muvaffaqiyatli yuborildi!' }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request body' }),
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
    };
  }
};
