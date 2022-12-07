const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TokenSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600
  }
});

let Token = mongoose.model('tokens', TokenSchema);

module.exports = Token;