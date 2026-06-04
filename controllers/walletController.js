const Wallet = require('../models/Wallet');

// Get all wallets
exports.getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find().populate('adminId', 'name email').sort({ createdAt: -1 });
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new wallet
exports.createWallet = async (req, res) => {
  const wallet = new Wallet({
    name: req.body.name,
    provider: req.body.provider,
    number: req.body.number,
    adminId: req.body.adminId,
    qrCodeUrl: req.body.qrCodeUrl,
    isPrimary: req.body.isPrimary !== undefined ? req.body.isPrimary : false,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  });

  try {
    const newWallet = await wallet.save();
    res.status(201).json(await newWallet.populate('adminId', 'name email'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a wallet
exports.updateWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    const updateFields = ['name', 'provider', 'number', 'adminId', 'qrCodeUrl', 'isPrimary', 'isActive'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        wallet[field] = req.body[field];
      }
    });

    const updatedWallet = await wallet.save();
    res.json(await updatedWallet.populate('adminId', 'name email'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a wallet
exports.deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    await wallet.deleteOne();
    res.json({ message: 'Wallet deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
