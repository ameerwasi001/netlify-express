const router = require("express").Router();
const Joi = require('joi');
const User = require('../../routes/user/user.model');
const notifications = require('../../helper/notifications');
const Post = require('../../routes/user/posts/posts.model');
const Comment = require('../../routes/user/comments/comments.model')
const UserList = require('../../admin/AddUsers/usersListModel')
const Network = require('../../routes/networks/networks.model')
const Collection = require('../../routes/user/collections/collections.model')
const Admin = require("../Account/model/accountSchema")
const aws = require('aws-sdk');

const config = {
    region: 'eu-west-2',
    accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
    secretAccessKey: '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',
    signatureVersion: 'v4',
  }

router.get('/all', async (req, res) => {
  try {
    console.log('GET /admin/users/all called');
    let users = await User.find().select('-password');

    res.status(200).send({
      success: true,
      users,
    });
  } catch (err) {
    console.log("error in GET /user/all", err);
    res.status(500).send({
      success: false,
      response: err,
    });
  }
});


router.get('/all/admin', async (req, res) => {
  try {
    console.log('GET /admin/users/all/admin called');
    let users = await Admin.find({}).select('-password');

    res.status(200).send({
      success: true,
      users,
    });
  } catch (err) {
    console.log("error in GET /user/all", err);
    res.status(500).send({
      success: false,
      response: err,
    });
  }
});

router.post('/setAdmin', async (req, res) => {
  try {
    console.log('POST /admin/users/setAdmin called');

    const {userId, state} = req.body

    await User.updateOne({_id: userId}, {$set: {isAdmin: state}});

    let users = await User.find().select('-password');

    res.status(200).send({
      success: true,
      users,
    });
  } catch (err) {

    console.log("error in POST /admin/users/setAdmin", err);
    res.status(500).send({
      success: false,
      response: err,
    });
  }
});


router.delete('/:userId', async (req, res) => {
  try {
    console.log('DELETE /admin/users/:userId called', req.params);

    const s3 = new aws.S3(config)

    // ======== Delete User Profile Picture from Bucket ========

    const u = await User.findById(req.params.userId)

    if(u.profilePicture !== undefined){
      let filename = u?.profilePicture.split('/').pop()

      await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()
    }

    // ======== Get & Delete User Collections, Posts and Comments on that Post ========

    const Collections = await Collection.find({user: req.params.userId})

    Collections.map(async (collection) => {

      const filename = collection?.cover.split('/').pop()

      await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()
    })

    await Collection.deleteMany({user: req.params.userId})
    
    const posts = await Post.find({user: u._id})

    if(posts.length !== 0){
      
      let Pids = []
      posts.map(async (post) => {
        Pids.push(post._id)

        const filename = post?.post?.location.split('/').pop()

        await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()

        if(post.comments.length !== 0){
          await Comment.deleteMany({_id: {$in: post.comments}})
        }
      })

      await Post.deleteMany({_id: {$in: Pids}})
      
    }

    // ======== Remove User ID from the UserList Array ========

    const userList = await UserList.find()

    await UserList.updateOne({_id: userList[0]['_id']}, {
      $pull: { users: req.params.userId},
    })


    // ======== Delete User Networks and Remove from Global Once ========

    const Networks = await Network.find({$or: [{privacy: 'global'}, {owner: req.params.userId}]})

    Networks.map(async (network) => {
      if(network.privacy === 'global'){
        await Network.updateOne({ _id: network._id }, {$pull: {members: { memberId: req.params.userId }}})
      }else{
        await Network.deleteOne({_id: network._id})
      }
    })

    let response = await User.deleteOne({ _id: req.params.userId });
    console.log('got delete user result', response);
    let users = await User.find().select('-password');
    res.status(200).send({
      success: true,
      users: users,
    });
  } catch (err) {
    console.log("error in DELETE /auth/user/", err);
    res.status(500).send({
      success: false,
      response: err,
    });
  }
});

router.put('/block/:userId/:isBlocked', async (req, res) => {
  try {
    console.log("PUT /admin/users/block called", req.params);
    let response = await User.updateOne(
      { _id: req.params.userId },
      {
        isBlocked: !(JSON.parse(req.params.isBlocked)),
      }
    );
    let users = await User.find().select('-password');
    console.log("got block user result", response);
    res.status(200).send({
      success: true,
      users
    });
  } catch (err) {
    console.log("error in PUT /admin/users/block", err);
    res.status(500).send({
      success: false,
      response: err,
    });
  }
});

router.put('/app-notifications/:isBlocked/:userId', async (req, res) => {
  try {
    console.log('PUT /admin/users/app-notifications called', req.params);
    console.log('req.params.isBlocked', req.params.isBlocked);
    console.log('type of req.params.isBlocked', !(JSON.parse(req.params.isBlocked)))
    let response = await User.updateOne({ _id: req.params.userId }, {
      isNotificationsBlocked: !(JSON.parse(req.params.isBlocked))
    });
    let users = await User.find();
    console.log('got response of /admin/app-notifications', response);
    res.status(200).send({
      success: true,
      users
    });
  } catch (err) {
    console.log('got error in PUT /admin/users/app-notifications', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/notification', async (req, res) => {
  try {
    console.log('POST /admin/users/notifications called', req.body);
    const schema = Joi.object({
      userId: Joi.string().required(),
      body: Joi.string().required(),
      title: Joi.string().required()
    });
    try {
      await schema.validateAsync({
        userId: req.body.user,
        body: req.body.body,
        title: req.body.title
      });
    } catch (err) {
      console.log('invalid data', err);
      return res.status(500).send({
        success: false,
        response: err
      });
    }
    let receiver = await User.findOne({ _id: req.body.user }).select('-password');
    let data = {
      sender: 'admin',
      receiver,
      title: req.body.title,
      msg: req.body.body,
      category: req.body.title,
    };
    await notifications.sendNotification(data);
    console.log('notification sent');
    res.status(200).send({
      success: true,
      response: 'Notification sent'
    });
  } catch (err) {
    console.log('got error in POST /admin/users/notification', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

module.exports = router;
