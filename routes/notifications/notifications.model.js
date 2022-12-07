const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let NotificationsSchema = new mongoose.Schema({
  receiver: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  sender: {     // requesteeId
    type: Schema.Types.ObjectId,
    // required: true,
    ref: 'users',
  },
  network: { type: Schema.Types.ObjectId, ref: 'network' },
  post: { type: Schema.Types.ObjectId, ref: 'posts' },
  notification: {
    category: String,   // Like, Comment, Admin Request, Join Network, Conneciton Request
    message: String
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  isAccepted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

let Notifications = mongoose.model('notifications', NotificationsSchema);

module.exports = Notifications;
