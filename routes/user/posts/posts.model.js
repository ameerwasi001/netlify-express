const mongoose = require('mongoose');

let PostsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  post: {
    media: String,     // picture/audio/video/file
    location: String   // path to picture/video/audio/file
  },
  caption: String,
  tags: [String],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comments' }],
  inspired: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  shares: Number,
  views: Number,
  isBlocked: {
    type: Boolean,
    default: false
  },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
}, { timestamps: true });

const Posts = mongoose.model('posts', PostsSchema);

module.exports = Posts;