const admin = require('firebase-admin');

// Load and initialize Firebase Admin using environment configuration
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized successfully.');
    } catch (error) {
      console.error('❌ Failed to parse/initialize Firebase Admin credentials:', error.message);
    }
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is not configured. FCM notifications will be skipped.');
  }
}

/**
 * Sends a push notification to an Admin device token or an Admin Topic.
 * @param {string} title - Push Notification Title
 * @param {string} body - Push Notification Message Body
 * @param {Object} [data] - Key-value metadata payloads
 * @param {string} [tokenOrTopic] - Device registration token OR topic name (defaults to 'admins')
 * @returns {Promise<string|null>} Message ID or null if unconfigured
 */
async function sendPushNotification(title, body, data = {}, tokenOrTopic = 'admins') {
  if (!admin.apps.length) {
    console.warn('⚠️ Firebase Admin not initialized. Skipping Push Notification.');
    return null;
  }

  const message = {
    notification: {
      title,
      body
    },
    data: data,
  };

  if (tokenOrTopic === 'admins' || tokenOrTopic.startsWith('/topics/')) {
    message.topic = tokenOrTopic.replace('/topics/', '');
  } else {
    message.token = tokenOrTopic;
  }

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('❌ FCM push delivery failed:', error);
    throw error;
  }
}

module.exports = { sendPushNotification };
