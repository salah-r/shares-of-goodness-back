import https from 'node:https';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Sends a push alert message to the configured Admin Telegram Group Chat
 * Uses Node.js native https library to minimize backend package weight
 * @param {string} message - HTML formatted message for Telegram
 * @returns {Promise<Object>} API parsed JSON response
 */
function sendTelegramAlert(message) {
  return new Promise((resolve, reject) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('⚠️ Telegram Bot Token or Chat ID not configured. Notification bypassed.');
      return resolve(null);
    }

    const payload = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseBody));
          } catch (e) {
            resolve({ success: true, raw: responseBody });
          }
        } else {
          reject(new Error(`Telegram API Error (Status ${res.statusCode}): ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

export { sendTelegramAlert };
