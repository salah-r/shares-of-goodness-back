const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true,
    default: 'فاعل خير',
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  shareAmount: {
    type: Number,
    required: true,
    min: [10, 'Minimum donation is 10 EGP']
  },
  walletId: {
    type: String, // Or mongoose.Schema.Types.ObjectId depending on preference
    required: true
  },
  receiptUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', DonationSchema);
