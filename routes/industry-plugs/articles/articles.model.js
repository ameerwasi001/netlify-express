const mongoose = require('mongoose');

let ArticlesSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
  date: {
    type: Date,
    default: Date.now()
  },
  heading: String,
  content: String,
  category: String,
  section: String,
  coverPhoto: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'articleComments' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  shares: Number
});

const Article = mongoose.model('articles', ArticlesSchema);

module.exports = Article;