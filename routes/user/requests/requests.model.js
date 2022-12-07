const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RequestsSchema = new mongoose.Schema({
  requesteeId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

let Requests = mongoose.model('requests', RequestsSchema);

module.exports = Requests;