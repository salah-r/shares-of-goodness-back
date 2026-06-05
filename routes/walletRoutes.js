const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route to get all active wallets for donations
router.get('/', walletController.getAllWallets);

// Protected routes for admin management
router.post('/', authMiddleware, walletController.createWallet);
router.put('/:id', authMiddleware, walletController.updateWallet);
router.delete('/:id', authMiddleware, walletController.deleteWallet);

module.exports = router;
