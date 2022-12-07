const router = require('express').Router();
const Comments = require('./comments.model');
const Posts = require('../posts/posts.model');
const User = require('../../user/user.model');
const notifications = require('../../../helper/notifications');

router.get('/received', async (req, res) => {
  try {
    console.log('GET /comments/ called', req.body);
    let comments = await Comments.find({
      receiver: req.body.userId
    }).populate('commenter', 'firstName lastName email profilePicture');
    console.log('comments', comments);
    res.status(200).send({
      success: true,
      comments
    });
  } catch (err) {
    console.log('error in getting comments');
    res.status(500).send({
      succes: false,
      msg: 'Failed in getting comments'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /comments/ called', req.body);
    let comment = await Comments.create({
      comment: req.body.comment,
      commenter: req.body.commenterId,
      receiver: req.body.receiverId,
      comment: req.body.comment
    });
    let post = await Posts.updateOne({ _id: req.body.postId }, {
      $push: {
        comments: comment._id
      }
    });
    console.log('comment posted', comment);
    let receiver = await User.findOne({ _id: req.body.receiverId });
    let sender = await User.findOne({ _id: req.body.commenterId });
    let data = {
      receiver,
      sender,
      title: 'Comment',
      category: 'Comment',
      msg: `${sender.firstName} ${sender.lastName} commented on your post`,
      post: req.body.postId
    }
    await notifications.sendNotification(data);
    res.status(200).send({
      success: true,
      msg: 'commented has been posted'
    });
  } catch (err) {
    console.log('error in POST /comments/', err);
    res.status(500).send({
      success: false,
      msg: 'Failed in posting comment'
    });
  }
});

module.exports = router;