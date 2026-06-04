import express from 'express';
const router = express.Router();
import multer from 'multer';
import { submitDonation, getDonations, updateDonationStatus } from '../controllers/donationController.js';

// Configure Multer for in-memory file uploads (efficient for serverless/free tiers)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// POST route for submitting donation with receipt
router.post('/submit', upload.single('receipt'), submitDonation);

// GET route for listing all donations for admin review
router.get('/', getDonations);

// PATCH route for updating donation status (approve/reject)
router.patch('/:id/status', updateDonationStatus);

export default router;
