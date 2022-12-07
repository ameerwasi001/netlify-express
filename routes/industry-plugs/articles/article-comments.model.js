const mongoose = require('mongoose');

let ArticleCommentsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'articles' },
  date: {
    type: Date,
    default: Date.now()
  },
  comment: String
});

const ArticleComments = mongoose.model('articleComments', ArticleCommentsSchema);

module.exports = ArticleComments;