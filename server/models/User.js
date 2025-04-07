const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  twoFactorSecret: { type: String }, // Secret key cho 2FA
  twoFactorEnabled: { type: Boolean, default: false }, // Trạng thái 2FA
  isLocked: { type: Boolean, default: false }, // Thêm trường isLocked
},{ timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);