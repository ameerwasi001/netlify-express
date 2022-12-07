const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  DOB: {
    type: String,
    default: ''
  },
  pronoun: {
    type: String,
    default: ''
  },
  currentPosition: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  emailVerified: Boolean,
  status: {
    type: String,
    default: ''
  },
  provider: {
    type: String,
    default: ''
  },        // Google, Facebook
  providerId: {
    type: String,
    default: ''
  },
  accessToken: {
    type: String,
    default: ''
  },
  refreshToken: {
    type: String,
    default: ''
  },
  networkAdmin: Boolean,
  profileMedia: [{ type: mongoose.Schema.Types.ObjectId, ref: 'posts' }],
  isNotificationsBlocked: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'posts' }],
  deviceToken: {
    type: String,
    default: ''
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  lastActive: Date
});

UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
}

const User = mongoose.model('users', UserSchema);

module.exports = User;
