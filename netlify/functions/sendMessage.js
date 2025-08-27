// Bu Asynchronous (asinxron) funksiya, Netlify tomonidan ishga tushiriladi
exports.handler = async function (event, context) {
  // Frontend'dan kelgan ma'lumotlarni o'qib olamiz
  const body = JSON.parse(event.body);
  const { name, phone, age } = body;

  // Netlify sozlamalaridan maxfiy ma'lumotlarni olamiz
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Telegram'ga yuboriladigan xabar matnini formatlaymiz
  const message = `
📢 Yangi Talaba Arizasi!

👤 Ism: *${name}*
📞 Telefon: \`${phone}\`
🎂 Yosh: *${age}*
  `;

  // Telegram Bot API uchun URL manzilini tayyorlaymiz
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Telegram'ga so'rovni yuborish
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown', // Xabarni chiroyli formatlash uchun
      }),
    });

    if (!response.ok) {
      throw new Error(`Server xatosi: ${response.statusText}`);
    }

    // Frontend'ga muvaffaqiyatli javob qaytaramiz
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Xabar muvaffaqiyatli yuborildi!' }),
    };
  } catch (error) {
    // Xatolik yuz bersa, log'ga yozamiz va frontend'ga xatolik haqida xabar beramiz
    console.error('Xatolik:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Xabar yuborishda xatolik yuz berdi.' }),
    };
  }
};
