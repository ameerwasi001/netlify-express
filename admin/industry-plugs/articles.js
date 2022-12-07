const router = require('express').Router();
const Articles = require('../../routes/industry-plugs/articles/articles.model');
const ArticleComments = require('../../routes/industry-plugs/articles/article-comments.model');
const aws = require('aws-sdk');

const config = {
  region: 'eu-west-2',
  accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
  secretAccessKey: '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',
  signatureVersion: 'v4',
}

router.get('/articles', async (req, res) => {
  try {
    console.log('GET /admin/industry-plugs/articles/ called');
    let articles = await Articles.find().sort({ date: -1 })
    .populate('author', 'firstName lastName profilePicture')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'firstName lastName profilePicture' }
    }).limit(10);
    // console.log('got GET /admin/industry-plugs/articles/ sds response', articles);
    res.status(200).send({
      success: true,
      articles
    });
  } catch (err) {
    console.log('error in GET /admin/industry-plugs/articles', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/articles', async (req, res) => {
  try {
    console.log('POST /admin/industry-plugs/articles called', req.body);
    await Articles.create({
      author: req.body.authId,
      heading: req.body.heading,
      content: req.body.content,
      category: req.body.category,
      section: req.body.section,
      coverPhoto: req.body.coverPhoto
    });
    res.status(200).send({
      success: true,
      response: 'Article created'
    });
  } catch (err) {
    console.log('got error in POST /admin/industry-plugs/articles', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.delete('/articles/:articleId', async (req, res) => {
  try {
    console.log('DELETE /admin/industry-plugs/articles called', req.params);

    let article = await Articles.findById(req.params.articleId)

    const s3 = new aws.S3(config)

    let filename = article?.coverPhoto.split('/').pop()

    await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()
    
    await ArticleComments.deleteMany({ _id : { $in : article.comments } })
    await Articles.deleteOne({ _id: req.params.articleId });

    let articles = await Articles.find();
    res.status(200).send({
      success: true,
      articles
    });
  } catch (err) {
    console.log('got error in /admin/industry-plugs/articles', err);
    res.status(500).send({
      success: false,
      err
    });
  }
});

router.post('/update_article',  async (req, res) => {
  try {
    console.log('POST /admin/industry-plugs/articles called', req.body);
    await Articles.updateOne({_id: req.body.id}, {$set: {
      heading: req.body.heading,
      content: req.body.content,
      category: req.body.category,
      section: req.body.section,
      coverPhoto: req.body.coverPhoto
    }})

    const articles = await Articles.find({})

    res.status(200).send({
      success: true,
      response: 'Article Update Successfully',
      data: articles
    });
  } catch (err) {
    console.log('got error in POST /admin/industry-plugs/articles', err);
    res.status(500).send({
      success: false,
      response: err,
      data: []
    });
  }
})

module.exports = router;