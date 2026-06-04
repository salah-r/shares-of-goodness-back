import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  provider: {
    type: String, // e.g. Vodafone Cash, InstaPay, CIB Smart Wallet
    required: true
  },
  number: {
    type: String, // Wallet phone number or instapay address
    required: true
  },
  qrCodeUrl: {
    type: String // Optional stored image file URL
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('Wallet', WalletSchema);
