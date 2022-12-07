const router = require('express').Router();
const Articles = require('./articles.model');
const User = require('../../user/user.model');
const ArticleComments = require('./article-comments.model');

router.get('/', async (req, res) => {
  try {
    console.log('GET /articles/ called');
    let articles = await Articles.find().sort({ date: -1 })
    .populate('author', 'firstName lastName profilePicture').limit(10);
    console.log('got GET /articles/ sds response', articles);
    res.status(200).send({
      success: true,
      articles
    });
  } catch (err) {
    console.log('error in GET /articles', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.get('/article-comments', async (req, res) => {
  try {
    console.log('GET /articles/article-comments called');
    let articles = await Articles.findOne({ _id: req.query.articleId })
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'firstName lastName profilePicture' }
    });
    console.log('got GET /articles/article-comments response', articles.comments);
    res.status(200).send({
      success: true,
      comments: articles.comments
    });
  } catch (err) {
    console.log('error in GET /articles/article-comments', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/', async (req, res) => {
  try {
    console.log('PUT /articles/ called', req.query);
    let user = await User.findOne({ _id: req.query.userId });
    if (user.isAdmin) {
      let response = await Articles.updateOne({ _id: req.query.articleId }, req.query.changings);
      console.log('got article update response', response);
      let article = await Articles.findOne({ _id: req.query.articleId });
      console.log('got updated article', article);
      res.status(200).send({
        success: true,
        response: 'Articled updated',
        article
      });
    } else {
      res.status(401).send({
        success: true,
        response: 'Action needs admin privillages'
      });
    }
  } catch (err) {
    console.log('got error in PUT /articles/', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/publish', async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.body.userId });
    if (!user?.isAdmin) {
      let article = await Articles.create(req.body.article);
      console.log('article published', article);
      res.status(200).send({
        success: true,
        response: 'Article Published'
      });
    } else {
      res.status(401).send({
        success: true,
        response: 'Action needs admin privillages'
      });
    }
  } catch (err) {
    console.log('got error in POST /articles.publish', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/like', async (req, res) => {
  try {
    console.log('PUT /articles/like called', req.query);
    let query;
    if (req.query.isLiked == 'true') {
      query = {
        $addToSet: {
          likes: req.query.userId
        }
      }
    } else {
      query = {
        $pull: {
          likes: req.query.userId
        }
      }
    }
    let response = await Articles.updateOne({ _id: req.query.articleId }, query);
    console.log('got like network response', response);
    let msg = req.query.isLiked == 'true' ? 'Article liked' : 'Article disliked'
    return res.status(200).send({
      success: true,
      response: msg
    });
  } catch(err) {
    console.log('got error in PUT /articles/like', req.query);
    return res.status(500).send({
      success: false,
      response: 'Internal server error'
    });
  }
});

router.delete('/', async (req, res) => {
  try {
    console.log('DELETE /articles/ called', req.query);
    let user = await User.findOne({ _id: req.query.userId });
    if (user.isAdmin) {
      let response = await Articles.deleteOne({ _id: req.query.articleId });
      let articles = await Articles.find();
      console.log('article delete response', response);
      console.log('got articles', articles);
      res.status(200).send({
        success: true,
        response: 'Article deleted',
        articles
      });
    } else {
      res.status(401).send({
        success: true,
        response: 'Action needs admin privillages'
      });
    }
  } catch (err) {
    console.log('error in DELETE /articles/:articleId', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/comment', async (req, res) => {
  try {
    console.log('POST /articles/comment called', req.body);
    let createComment = await ArticleComments.create({
      user: req.body.userId,
      article: req.body.articleId,
      comment: req.body.comment
    });
    console.log('create comment response', createComment);
    let response  = await Articles.updateOne({ _id: req.body.articleId }, {
      $push: {
        comments: createComment._id
      }
    });
    console.log('posting comment response', response);
    return res.status(200).send({
      success: true,
      response: 'Comment posted'
    });
  } catch(err) {
    console.log('got error while commenting on article', err);
    return res.status(500).send({
      success: false,
      response: 'Internal server error'
    });
  }
});

module.exports = router;