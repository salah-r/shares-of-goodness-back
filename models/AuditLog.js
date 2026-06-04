import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String, // e.g., LOGIN, APPROVE_DONATION, REJECT_DONATION, UPDATE_WALLET, CHANGE_SETTINGS
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AuditLog', AuditLogSchema);
