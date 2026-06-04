import Donation from '../models/Donation.js';
import Wallet from '../models/Wallet.js';
import { uploadReceipt } from '../services/supabaseService.js';
import { sendTelegramAlert } from '../services/telegramService.js';
import { sendPushNotification } from '../services/fcmService.js';
import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Submits a new donation transaction for administrator review
 * Route: POST /api/donations/submit
 * Middleware: multer upload.single('receipt')
 */
async function submitDonation(req, res) {
  try {
    const { donorName, phone, isAnonymous, shareAmount, walletId } = req.body;
    const file = req.file;

    // 1. Inputs validation check
    if (!phone || !shareAmount || !walletId) {
      return res.status(400).json({ error: 'Missing required parameters. (phone, shareAmount, and walletId are required)' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Proof of donation receipt screenshot is required.' });
    }

    // 2. Upload file to Supabase Storage
    const fileExt = file.originalname.split('.').pop() || 'png';
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExt}`;
    
    let receiptUrl;
    try {
      receiptUrl = await uploadReceipt(file.buffer, uniqueFileName, file.mimetype);
    } catch (uploadError) {
      console.error('Supabase Receipt Upload Error:', uploadError);
      return res.status(500).json({ error: 'Failed to process and store donation receipt. Please try again.' });
    }

    // 3. Save Donation record in MongoDB
    const displayName = (isAnonymous === 'true' || isAnonymous === true) ? 'فاعل خير' : (donorName || 'فاعل خير');

    const donation = new Donation({
      donorName: displayName,
      phone,
      isAnonymous: (isAnonymous === 'true' || isAnonymous === true),
      shareAmount: Number(shareAmount),
      walletId,
      receiptUrl,
      status: 'pending' // Verification starts as pending
    });

    const savedDonation = await donation.save();

    // 4. Retrieve chosen wallet info to detail notifications
    let walletInfo = { name: 'Vodafone Cash', provider: 'Vodafone', number: '01023456789' };
    try {
      // Find wallet if valid ObjectId, otherwise bypass
      if (walletId.match(/^[0-9a-fA-F]{24}$/)) {
        const dbWallet = await Wallet.findById(walletId);
        if (dbWallet) {
          walletInfo = dbWallet;
        }
      }
    } catch (dbErr) {
      console.warn('Could not retrieve full wallet document, fallback to dummy info.');
    }

    // 5. Fire Hybrid Background Notifications (Telegram + Firebase Push)
    triggerHybridNotifications(savedDonation, walletInfo).catch(notifyErr => {
      console.error('Non-blocking background notification error:', notifyErr);
    });

    // 6. Return response to front-end to clear localStorage drafts
    return res.status(201).json({
      success: true,
      message: 'Donation submission successful. Awaiting admin verification.',
      donationId: savedDonation._id
    });

  } catch (error) {
    console.error('Donation submission controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Fetches all donation records sorted by creation date descending
 * Route: GET /api/donations
 */
async function getDonations(req, res) {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    return res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Updates a donation status (approving or rejecting it)
 * Route: PATCH /api/donations/:id/status
 */
async function updateDonationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Status must be approved or rejected.' });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    donation.status = status;
    const updatedDonation = await donation.save();

    // Log the action to AuditLog
    try {
      // Imports moved to top of file
      const dummyAdminId = new mongoose.Types.ObjectId('000000000000000000000000');
      
      const log = new AuditLog({
        adminId: dummyAdminId,
        action: status === 'approved' ? 'APPROVE_DONATION' : 'REJECT_DONATION',
        details: `Donation of ${donation.shareAmount} EGP by ${donation.donorName} was ${status}.`,
        ipAddress: req.ip || '127.0.0.1'
      });
      await log.save();
    } catch (logErr) {
      console.warn('Audit log creation failed:', logErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Donation successfully ${status}.`,
      donation: updatedDonation
    });
  } catch (error) {
    console.error('Error updating donation status:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Sends notifications asynchronously to prevent block on Express thread
 */
async function triggerHybridNotifications(donation, wallet) {
  // Construct a beautiful HTML message for the Telegram admin group
  const telegramMessage = `
🔔 <b>تبرع جديد قيد المراجعة!</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>المتبرع:</b> ${donation.donorName} ${donation.isAnonymous ? '(فاعل خير)' : ''}
💰 <b>المبلغ:</b> ${donation.shareAmount} EGP
📱 <b>الهاتف:</b> ${donation.phone}
🏦 <b>المحفظة المستلمة:</b> ${wallet.name} (${wallet.provider} - ${wallet.number})
📄 <b>رابط الإيصال:</b> <a href="${donation.receiptUrl}">عرض صورة الإيصال</a>
━━━━━━━━━━━━━━━━━━━
يرجى الدخول إلى لوحة التحكم للموافقة أو الرفض.
  `;

  // Action 1: Telegram Bot Alert (Instant and reliable admin channels)
  try {
    await sendTelegramAlert(telegramMessage);
    console.log(`Telegram Bot notified for donation ID: ${donation._id}`);
  } catch (error) {
    console.error('Telegram dispatch failed:', error.message);
  }

  // Action 2: Firebase FCM Alert (Device native notification alerts)
  try {
    await sendPushNotification(
      'تبرع جديد قيد المراجعة 💰',
      `تم استلام تبرع بقيمة ${donation.shareAmount} EGP من ${donation.donorName}`,
      {
        donationId: donation._id.toString(),
        amount: donation.shareAmount.toString(),
        type: 'new_donation'
      },
      'admins'
    );
    console.log(`FCM admin notification sent for donation ID: ${donation._id}`);
  } catch (error) {
    console.error('FCM dispatch failed:', error.message);
  }
}

export { submitDonation, getDonations, updateDonationStatus };
