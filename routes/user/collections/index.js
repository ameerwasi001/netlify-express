const router = require('express').Router();
const Collections = require('./collections.model');
const Comment = require('../comments/comments.model')
const Post = require('../posts/posts.model')

router.get('/', async (req, res) => {
  try {
    console.log('GET /collections called', req.query);
    let collection = await Collections.findOne({ _id: req.query.id })
      .populate('user', 'firstName lastName profilePicture email')
      .populate({
        path: 'posts',
        populate: [
          { path: 'user', select: 'firstName lastName profilePicture' },
          {
            path: 'comments',
            populate: [{
              path: 'commenter', select: 'firstName lastName profilePicture email'
            }, {
              path: 'receiver',
              select: 'firstName lastName profilePicture email'
            }]
          },
          { path: 'inspired', select: 'firstName lastName profilePicture' },
        ]
      });
    console.log('got collection', collection);
    res.status(200).send({
      success: true,
      collection
    });
  } catch (err) {
    console.log('error in getting collection by id', err);
    res.status(500).send({
      success: false,
      respone: 'Failed to get collection'
    })
  }
});

router.get('/by-user', async (req, res) => {
  try {
    let collections = await Collections.find({ user: req.query.id })
      .populate('user', 'firstName lastName email profilePicture')
      .populate('posts', '-isBlocked')
    console.log('got user collections', collections);
    res.status(200).send({
      success: true,
      collections
    })
  } catch (err) {
    console.log('Failed to get user collections', err);
    res.status(500).send({
      success: false,
      response: err
    })
  }
});

router.post('/', async (req, res) => {
  try {
    let collection = await Collections.create({
      user: req.body.user,
      name: req.body.name,
      cover: req.body.cover
    });
    console.log('collection created', collection);
    res.status(200).send({
      success: true,
      response: collection
    })
  } catch (err) {
    console.log('got error in creating collection', err);
    res.status(500).send({
      success: false,
      response: 'Failed to create collection'
    })
  }
});

router.put('/name', async (req, res) => {
  try {
    console.log('PUT /collections/name called', req.body);
    let updatedCollection = await Collections.updateOne({ _id: req.body.collectionId }, {
      name: req.body.name
    });
    console.log('collection updated', updatedCollection);
    let collection = await Collections.findOne({ _id: req.body.collectionId }).select('name');
    res.status(200).send({
      success: true,
      response: collection
    });
  } catch (err) {
    console.log('got error in updating collection', err);
    res.status(200).send({
      success: false,
      response: 'Failed to update collection'
    });
  }
});

router.delete('/', async (req, res) => {
  try {
    let collection = await Collections.findOne({ _id: req.query.id }).populate({
      path: 'posts',
      select : '_id comments',
    }) 

    let posts = []
    let comments = []

    collection.posts.map(id => {
      posts.push(id._id)
      id.comments.map(com => comments.push(com))
    })

    await Comment.deleteMany({ _id : { $in : comments } })

    await Post.deleteMany({ _id : { $in : posts } })

    await Collections.deleteOne({_id: req.query.id})

    res.status(200).send({
      success: true,
    });
  } catch (err) {
    console.log('got error in deleting collection', err);
    res.status(500).send({
      success: false,
      response: err
    })
  }
});

module.exports = router;