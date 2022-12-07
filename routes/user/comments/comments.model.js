const mongoose = require('mongoose');

let CommentsSchema = new mongoose.Schema({
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  comment: {
    category: String, // Audio, Text
    content: String     // Cloud path to audio or text comment
  }
}, { timestamps: true });

const Comments = mongoose.model('comments', CommentsSchema);

module.exports = Comments;
