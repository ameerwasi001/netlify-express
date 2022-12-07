const router = require('express').Router();
const Posts = require('./posts.model');
const Collections = require('../collections/collections.model');
const User = require('../user.model');
const notifications = require('../../../helper/notifications');

router.get('/', async (req, res) => {
  console.log('GET /posts/ called', req.body);
  try {
    let posts = await Posts.find({
      user: req.body.userId
    }).populate({
      path: 'comments',
      populate: { path: 'commenter', select: 'firstName lastName email profilePicture' }
    }).populate('user').select('firstName lastName profilePicture');
    console.log('posts', posts);
    res.status(200).send({
      success: true,
      posts
    });
  } catch (err) {
    console.log('got error in GET /auth/multi-level-populate', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get multi-level-populate'
    });
  }
});

router.get('/single', async (req, res) => {
  console.log('GET /posts/single called', req.body);
  try {
    let post = await Posts.findOne({
      _id: req.query.postId
    }).populate({
      path: 'comments',
      populate: { path: 'commenter receiver', select: 'firstName lastName email profilePicture' },
    }).populate('user', 'firstName lastName profilePicture email')
    .populate('inspired', 'firstName lastName email profilePicture');
    console.log('posts', post);
    res.status(200).send({
      success: true,
      post
    });
  } catch (err) {
    console.log('got error in GET /auth/multi-level-populate', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get post details'
    });
  }
});

router.get('/others', async (req, res) => {
  try {
    console.log('GET /posts/others called', req.query);

    const user = await User.findOne({_id: req.query.userId})

    if(user){

      await User.updateOne({_id: req.query.userId}, {$set: {lastActive: new Date()}})

      if(user?.connections.length > 0 && user?.connections) {

        let posts = await Posts.find({ user: { $in: user?.connections }, isBlocked: false })
        .populate({
          path: 'comments',
          populate: {
            path: 'commenter',
            select: 'firstName lastName email profilePicture currentPosition industry'
          }
        })
        .populate('inspired', 'firstName lastName profilePicture')
        .populate('user', 'firstName lastName profilePicture').sort({ createdAt: -1 })
        .skip((parseInt(req.query.pageNumber) * 20) - 20)
        .limit(10);
  
        res.status(200).send({
          success: true,
          posts
        });
  
      }else{
        res.status(500).send({
          success: false,
          msg: 'No Posts',
          posts: []
        });
      }

    }else{
      res.status(200).send({
        success: false,
        msg: 'User not found',
        posts: []
      });
    }

  } catch (err) {
    console.log('error in GET /posts/others', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get posts of other users'
    });
  }
});

router.put('/increment-share-count', async (req, res) => {
  try {
    console.log('PUT /posts/increment-share-count called', req.query);
    let response = await Posts.updateOne({ _id: req.query.postId }, {
      $inc: { shares: 1 }
    });
    let post = await Posts.findOne({ _id: req.query.postId });
    let shares = post.shares;
    console.log('got increment share count response', response);
    res.status(200).send({
      success: true,
      shares
    });
  } catch (err) {
    console.log('error in PUT /posts/increment-share-count', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/inspired', async (req, res) => {
  try {
    console.log('PUT /posts/inspired called', req.query);
    let query;
    if (req.query.isInspired === 'true') {
      query = {
        $addToSet: {
          inspired: req.query.userId
        }
      }
    } else {
      query = {
        $pull: {
          inspired: req.query.userId
        }
      }
    }
    console.log('query', query)
    let response = await Posts.updateOne({ _id: req.query.postId }, query);
    let post = await Posts.findOne({ _id: req.query.postId });
    let receiver = await User.findOne({ _id: req.query.artistId });
    let sender = await User.findOne({ _id: req.query.userId });
    console.log('sender', sender);
    console.log('receiver', receiver);
    if(req.query.isInspired === 'true') {
      let data = {
        receiver,
        sender,
        title: 'Post liked!',
        msg: `${sender.firstName} ${sender.lastName} is inspired by your post.`,
        category: 'Likes Post',
        post: req.query.postId
      }
      let notificationResponse = await notifications.sendNotification(data);
      if (notificationResponse == 'Failed to send notification') {
        console.log('notification sending failed');
        return res.status(500).send({
          success: false,
          response: 'Failed to send notification'
        });
      } else if (notificationResponse == 'Error saving notification') {
        console.log('notification saving failed');
        return res.status(500).send({
          success: false,
          response: 'Error saving notification'
        });
      }
      console.log('got response of /posts/inspired', response);
      return res.status(200).send({
        success: true,
        inspiredCount: post.inspired.length
      });
    }

  } catch (err) {
    console.log('got error in PUT /posts/inspired ', err);
    res.status(500).send({
      success: false,
      respone: err
    });
  }
});

router.put('/favourite', async (req, res) => {
  try {
    console.log('PUT /posts/favourite called', req.query);
    let query;
    if (req.query.isFavourite === 'true') {
      query = {
        $addToSet: {
          favourites: req.query.postId
        }
      }
    } else {
      query = {
        $pull: {
          favourites: req.query.postId
        }
      }
    }
    console.log('query', query);
    let response = await User.updateOne({ _id: req.query.userId }, query);
    console.log('got favourite response', response);
    res.status(200).send({
      success: true,
      response
    });
  } catch (err) {
    console.log('error POST in /user/favourite', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/view', async (req, res) => {
  try {
    console.log('PUT /posts/view called', req.query);
    if(!req.query.postId) {
      return res.status(400).send({ 
        success: false,
        response: 'Post ID is required'
      });
    } else {
      let response = await Posts.updateOne({ _id: req.query.postId }, {
        $inc: { views: 1 }
      });
      console.log('got view response', response);
      return res.status(200).send({
        success: true,
        response: 'Post liked'
      });
    }
  } catch (err) {
    console.log('got error in PUT /posts/view', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
})

router.post('/', async (req, res) => {
  try {
    console.log('POST /posts/ called', req.body.post);
    req.body.post.location = `https://d2m3pglccrnab5.cloudfront.net/${req.body.post.location}`;
    let post = await Posts.create({
      post: req.body.post,
      caption: req.body.caption,
      tags: req.body.tags,
      user: req.body.userId
    });
    console.log('post published', post);
    if(req.body.collectionId) {
      let updateCollection = await Collections.updateOne({ _id: req.body.collectionId }, {
        $push: { posts: post._id }
      });
      console.log('update collection with photos', updateCollection);
    } else {
      let updateUserMedia = await User.updateOne({ _id: req.body.userId }, {
        $push: { profileMedia: post._id  }
      });
    }
    return res.status(200).send({
      success: true,
      msg: 'Post published'
    });
  } catch (err) {
    console.log('error in POST /post/', err);
    return res.status(500).send({
      success: false,
      msg: 'Failed to publish a post'
    });
  }
});

router.delete('/self', async (req, res) => {
  try {
    console.log('DELETE /posts/self called', req.query);
    let user = await User.findOne({ _id: req.query.userId });
    let post = await Posts.findOne({ _id: req.query.postId });
    if((post.user).toString() === (user._id).toString()) {
      console.log('authorized user');
      let deletePost = await Posts.deleteOne({ _id: req.query.postId });
      await User.updateOne({_id: req.query.userId}, {$pull: {profileMedia: req.query.postId}})
      await Collections.updateMany({user: req.query.userId}, {$pull: {posts: req.query.postId}})
      console.log('delete post response', deletePost);
      return res.status(200).send({
        success: true,
        msg: 'Post deleted'
      });
    } else {
      return res.status(500).send({
        success: false,
        msg: 'Unauthorized user'
      });
    }
  } catch (error) {
    console.log('got error in DELETE /posts/self', error);
    return res.status(500).send({
      success: false,
      msg: 'Internal server error'
    });
  }
});

router.put('/report', async (req, res) => {
  try {
    console.log('PUT /posts/report called', req.query);
    let reportPost = await Posts.updateOne({ _id: req.query.postId }, {
      $addToSet: {
        reportedBy: req.query.userId
      }
    });
    console.log('response of report post', reportPost);
    return res.status(200).send({
      success: true,
      msg: 'Post reported'
    });
  } catch (error) {
    console.log('got error in PUT /posts/report', error);
    return res.status(500).send({
      success: false,
      msg: 'Internal server error'
    });
  }
});

module.exports = router;