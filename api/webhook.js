// ============================================
// WEBHOOK SWITCHFY → TELEGRAM
// File: api/webhook.js
// ============================================

export default async function handler(req, res) {
  // ------------------------------------------
  // BAGIAN 1: Cek metode request
  // ------------------------------------------
  // Switchfy selalu kirim POST. Kalau bukan POST, tolak.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ------------------------------------------
    // BAGIAN 2: Ambil data dari Switchfy
    // ------------------------------------------
    const payload = req.body;
    
    console.log('Event diterima:', payload.event);

    // Cek apakah ini event pesan masuk (berisi OTP)
    if (payload.event === 'message.received') {
      const messageText = payload.data.message || 'Pesan kosong';
      const phoneNumber = payload.data.number || 'Nomor tidak diketahui';
      const source = payload.data.source || 'UNKNOWN';

      // ------------------------------------------
      // BAGIAN 3: Format pesan untuk Telegram
      // ------------------------------------------
      const telegramMessage = 
        `📱 *OTP Diterima!*\n\n` +
        `*Sumber:* ${source}\n` +
        `*Nomor:* ${phoneNumber}\n` +
        `*Pesan:* \`${messageText}\``;

      // ------------------------------------------
      // BAGIAN 4: Ambil kredensial dari Environment
      // ------------------------------------------
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      // Validasi: pastikan kredensial ada
      if (!botToken || !chatId) {
        console.error('Environment variable tidak lengkap!');
        return res.status(500).json({ 
          error: 'Bot token atau chat ID belum di-set' 
        });
      }

      // ------------------------------------------
      // BAGIAN 5: Kirim ke Telegram
      // ------------------------------------------
      const telegramUrl = 
        `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      });

      // Cek apakah Telegram menerima pesan
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gagal kirim ke Telegram:', errorText);
        return res.status(500).json({ 
          error: 'Gagal kirim ke Telegram',
          detail: errorText 
        });
      }

      console.log('Berhasil kirim OTP ke Telegram!');
    }

    // ------------------------------------------
    // BAGIAN 6: Balas 200 OK ke Switchfy
    // ------------------------------------------
    // WAJIB! Kalau tidak 200, Switchfy akan retry.
    return res.status(200).json({ status: 'success' });

  } catch (error) {
    // ------------------------------------------
    // BAGIAN 7: Tangani error tak terduga
    // ------------------------------------------
    console.error('Error tidak terduga:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
