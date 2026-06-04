const Admin = require('../models/Admin');
const Wallet = require('../models/Wallet');
const bcrypt = require('bcryptjs');

// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new admin
exports.createAdmin = async (req, res) => {
  try {
    const password = req.body.password || '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    const newAdmin = await admin.save();
    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an admin
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (req.body.name != null) admin.name = req.body.name;
    if (req.body.email != null) admin.email = req.body.email;
    if (req.body.isActive != null) admin.isActive = req.body.isActive;
    
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedAdmin = await admin.save();
    res.json(updatedAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Also delete associated wallets or handle them appropriately
    await Wallet.deleteMany({ adminId: admin._id });

    await admin.deleteOne();
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
