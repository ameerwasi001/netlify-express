const mongoose = require('mongoose');

let CollectionsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  name: {
    type: String,  // must be unique for a single user
    required: true
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'posts' }],
  cover: String
});

const Collections = mongoose.model('collections', CollectionsSchema);

module.exports = Collections;