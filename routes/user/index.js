const router = require('express').Router();
const Joi = require('joi');
const Collections = require('./collections/collections.model');
const Posts = require('./posts/posts.model');
const User = require('./user.model');
const Networks = require('../networks/networks.model');
const Notifications = require('../notifications/notifications.model');
const notifications = require('../../helper/notifications');

router.get('/', async (req, res) => {
  try {
    console.log('GET /posts/ artist profile called', req.query);
    let user = await User.findOne({
      _id: req.query.userId
    })
      .select('-password -favourites -emailVerified -provider -accessToken -refreshToken -isAdmin -networkAdmin -deviceTokens')
      .populate('connections', 'firstName lastName email profilePicture');
    console.log('user', user);
    res.status(200).send({
      success: true,
      user
    })
  } catch (err) {
    console.log('error in GET /user/', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get profile'
    })
  }
});

router.get('/online', async (req, res) => {
  try {
    console.log('GET /user/online called', req.query);
    if(!req.query.userId) {
      return res.status(500).send({
        success: false,
        response: "Logged in user's id required"
      });
    }
    let users = await User.find({ $and: [{ connections: req.query.userId }, { status: 'online' }] }).select('firstName lastName profilePicture status');
    console.log('got response of GET /user/online', users);
    res.status(200).send({
      success: true,
      users
    });
  } catch(err) {
    console.log('got error in GET /user/online', err);
    res.status(500).send({
      success: false,
      response: 'Faield to get online users'
    });
  }
});

router.get('/profile-media', async (req, res) => {
  try {
    console.log('GET /users/profile-media  called', req.query);
    let user = await User.findOne({
      _id: req.query.userId
    }).populate({
      path: 'profileMedia',
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
    }).select('profileMedia')
    console.log('user', user);
    res.status(200).send({
      success: true,
      user
    })
  } catch (err) {
    console.log('error in GET /user/profile-media', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get profile media'
    })
  }
});

router.get('/self', async (req, res) => {
  try {
    console.log('GET /user/self called', req.query.userId);
    let user = await User.findOne({
      _id: req.query.userId
    }).select('-password')
    .populate('connections', 'firstName lastName email profilePicture')
    .populate('favourites', '-isBlocked -inspired');
    console.log('user', user);
    res.status(200).send({
      success: true,
      user
    });
  } catch (err) {
    console.log('error in GET /user/self', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get profile'
    })
  }
});

router.get('/others', async (req, res) => {
  try {
    console.log('/user/others called', req.body);
    let users = await User.find({ _id: { $ne: req.body.userId } }).select('firstName lastName pictures');
    res.status(200).send({
      success: true,
      users
    });
  } catch (err) {
    console.log('error in /auth/others', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to get /auth/others'
    })
  }
});

router.get('/favourites', async (req, res) => {
  try {
    console.log('GET /user/favourites', req.query);
    let response = await User.findOne({ _id: req.query.id })
      .select('favourites -_id')
      .populate('favourites', 'firstName lastName profilePicture email');
    console.log('got favourites', favourites);
    res.status(200).send({
      success: true,
      favourites: response.favourites
    });
  } catch (err) {
    console.log('error in GET /user/favourites', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.get('/inspired-count', async (req, res) => {
  try {
    console.log('/user/inspired called', req.body);
    let posts = await Posts.find({ user: req.query.userId });
    let inspiredCount = 0;
    posts.forEach((post) => {
      inspiredCount += post.inspired.length;
    });
    res.status(200).send({
      success: true,
      inspiredCount
    });
  } catch (err) {
    console.log('error in getting inspired list', err);
    res.status(500).send({
      success: false,
      msg: 'Failed in getting inspired list'
    });
  }
});

router.get('/connections-count', async (req, res) => {
  try {
    console.log('/user/connections called', req.query);
    let user = await User.findOne({ _id: req.query.userId });
    let connections = user.connections.length;
    console.log('total connections', connections);
    res.status(200).send({
      success: true,
      connections
    });
  } catch (err) {
    console.log('error in getting connections count', err);
    res.status(500).send({
      success: false,
      msg: 'Failed in getting connections count'
    });
  }
});

router.get('/media-count', async (req, res) => {
  try {
    console.log('/user/media-count called', req.query);
    let mediaCount = 0;
    let collections = await Collections.find({ user: req.query.userId });
    console.log('collections', collections);
    collections.forEach((collection) => {
      mediaCount += collection.posts.length;
    });
    let user = await User.findOne({ _id: req.query.userId });
    let media = user.profileMedia;
    mediaCount = mediaCount + media.length;
    console.log('got media count response', mediaCount);
    res.status(200).send({
      success: true,
      mediaCount
    });
  } catch (err) {
    console.log('got error in GET /user/media-count', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.get('/connections', async (req, res) => {
  try {
    let user = await User.findOne({
      _id: req.body.userId
    }).populate('connections', 'firstName lastName email profilePicture');
    let connections = user.connections;
    console.log('got connections', connections);
    res.status(200).send({
      success: true,
      connections
    });
  } catch (err) {
    console.log('error in GET /user/connections', err);
    res.status(500).send({
      success: false,
      response: 'Failed to get list of connections'
    })
  }
});

router.get('/networks', async (req, res) => {
  try {
    console.log('GET /user/networks/ called', req.query);
    let networks = await Networks.find({
      $or: [{ 'members.memberId': req.query.userId }, { owner: req.query.userId }]
    }).populate('owner', 'firstName lastName email profilePicture')
      .populate('admin', 'firstName lastName profilePicture')
      .populate('members.memberId', 'firstName lastName email profilePicture')
      .populate('messages.sentBy', 'firstName lastName email profilePicture');
    res.status(200).send({
      success: true,
      networks
    })
  } catch (err) {
    console.log('error in GET /networks/', err);
    res.status(500).send({
      success: true,
      response: 'Failed to get user networks'
    });
  }
});

router.put('/setup', async (req, res) => {
  try {
    console.log('PUT /user/setup called, req.body', req.body);
    let data = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      DOB: req.body.birthday,
      pronoun: req.body.pronoun,
      currentPosition: req.body.currentPosition,
      industry: req.body.industry,
      profilePicture: req.body.profilePicture,
      cover: req.body.cover
    };
    let userExist = await User.findOne({ _id: req.body.id });
    if (userExist) {
      console.log('userExist', userExist);
      await User.updateOne({ _id: req.body.id }, data);
      let user = await User.findOne({ _id: req.body.id }).select('-password')
      .populate('connections', 'firstName lastName profilePicture')
      .populate({
        path: 'favourites',
        select: '-isBlocked',
        populate: { path: 'user', select: 'firstName lastName email profilePicture' }
      });
      return res.status(200).send({
        success: true,
        user
      });
    } else {
      return res.status(500).send({
        success: true,
        respone: 'No user found'
      });
    }
  } catch (err) {
    console.log('error in PUT /user/setup', err);
    return res.status(500).send({
      success: false,
      msg: 'Failed setting up profile'
    });
  }
});

router.put('/remove-token', async (req, res) => {
  try {
    console.log('PUT /user/remove-token called', req.query);
    let user = await User.updateOne({ _id: req.query.userId }, {
      $pull: {
        deviceTokens: req.query.deviceToken
      }
    });
    console.log('got remove token response', user);
    res.status(200).send({
      success: true,
      response: user
    });
  } catch (err) {
    console.log('got error in PUT /user/remove-token', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/inspired', async (req, res) => {
  try {
    console.log('/user/inspire called', req.body);
    let user = await User.updateOne({ _id: req.body.artistId }, {
      $push: {
        inspired: req.body.userId       // userId is the id of user who hit inspire
      }
    });
    console.log('inspired added', user);
    res.status(200).send({
      success: true,
      msg: 'Added Inspiration'
    })
  } catch {
    console.log('error in /user/inspired', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to inspire'
    });
  }
});

router.put('/connect-request', async (req, res) => {
  try {
    console.log('PUT /user/connect-request called', req.query);
    let query;
    if (req.query.connect === 'true') {
      query = {
        $addToSet: {
          connections: req.query.requesteeId
        }
      }
    } else {
      query = {
        $pull: {
          connections: req.query.requesteeId
        }
      }
    }
    console.log('query', query);
    let response1 = await User.updateOne({ _id: req.query.userId }, query);
    console.log('got connection response', response1);
    if (req.query.connect === 'true') {
      query = {
        $addToSet: {
          connections: req.query.userId
        }
      }
    } else {
      query = {
        $pull: {
          connections: req.query.userId
        }
      }
    }
    console.log('query', query);
    let response2 = await User.updateOne({ _id: req.query.requesteeId }, query);
    console.log('got connection response', response2);
    let msg = req.query.connect === 'true' ? 'Connection Added Successfully' : 'Connection Removed Successfully'
    res.status(200).send({
      success: true,
      response: msg
    });
  } catch (err) {
    console.log('error POST in /user/connect-request', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/connect', async (req, res) => {
  try {
    console.log('POST /user/connect called', req.query);
    let receiver = await User.findOne({ _id: req.query.artistId });
    let sender = await User.findOne({ _id: req.query.userId });
    let data = {
      receiver,
      sender,
      title: 'Connection Request',
      msg: `${sender.firstName} ${sender.lastName} wants to conenct`,
      category: 'Conneciton Request'
    };
    let sendNotificationResponse = await notifications.sendNotification(data);
    console.log('got send notification response', sendNotificationResponse);
    res.status(200).send({
      success: true,
      response: 'Request sent'
    });
  } catch(err) {
    console.log('got error in connection request', err);
    res.status(500).send({
      success: false,
      response: 'Failed to sent connection request'
    });
  }
});

router.put('/offline', async (req, res) => {
  try {
    console.log('PUT /user/offline called', req.query);
    let response = await User.updateOne({ _id: req.query.userId }, {
      status: 'offline'
    });
    console.log('got response of PUT /user/offline', response);
    res.status(200).send({
      success: true,
      response: 'Marked as offline'
    });
  } catch(err) {
    console.log('got error in PUT /user/offline', err);
    res.status(500).send({
      success: false,
      response: 'Failed to mark offline'
    });
  }
})

router.get('/search', async (req, res) => {
  console.log('GET /user/search called', req.query);
  try {
    let regex = new RegExp(`${req.query.search}`, 'i');
    console.log('regex', regex)
    let users = await User.find({ 
      $or: [{ firstName: regex }, { lastName: regex }] 
    }).select('firstName lastName email profilePicture cover pronoun currentPosition industry phone profileMedia');
    console.log('users', users);
    let networks = await Networks.find({ name: regex })
    .populate('members.memberId', 'firstName lastName email profilePicture cover pronoun currentPosition industry phone profileMedia');
    console.log('networks', networks);
    let posts = await Posts.find({ tags: regex }).populate('user', 'firstName lastName email profilePicture cover')
    console.log('posts', posts);
    return res.status(200).send({
      status: true,
      response: { users: users, networks: networks, posts: posts }
    });
  } catch (err) {
    console.error('got error in search endpoint', err);
    return res.status(200).send({
      status: false,
      response: 'Internal server error'
    });
  }
});

router.put('/report', async (req, res) => {
  try {
    console.log('PUT /user/report called', req.query);
    let reportUser = await User.updateOne({ _id: req.query.userId }, {
      $addToSet: {
        reportedBy: req.query.userId
      }
    });
    console.log('response of report user', reportUser);
    return res.status(200).send({
      success: true,
      msg: 'User reported'
    });
  } catch (error) {
    console.log('got error in PUT /user/self', error);
    return res.status(500).send({
      success: false,
      msg: 'Internal server error'
    });
  }
});

module.exports = router;