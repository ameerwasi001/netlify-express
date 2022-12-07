const mongoose = require('mongoose');

let NetworksSchema = mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
  name: {
    type: String,
    required: true
  },
  privacy: {
    type: String,
    default: 'private'  // public/private
  },
  networkIcon: String,
  members: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    isAdmin: { type: Boolean, default: false }
  }],
  messages: [{
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    message: {
      picture: String,
      text: String
    },
    responses: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
      message: String
    }],
    inspired: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
    sendTime: Date
  }]
});

let Networks = mongoose.model('networks', NetworksSchema);

module.exports = Networks;