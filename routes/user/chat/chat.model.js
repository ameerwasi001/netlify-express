const mongoose = require('mongoose');

let ChatSchema = new mongoose.Schema({
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  sentTo: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  chatName: String,
  messages: [{
    isSeen: false,
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    sentTo: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    body: String,
    attachments: [{
      location: String,
      name: String
    }],
    sendTime: Date,
  }],
  seen: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: String,
    default: ''
  },
  lastSender: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
});

let Chat = mongoose.model('chats', ChatSchema);

module.exports = Chat;
