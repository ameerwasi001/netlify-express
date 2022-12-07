const router = require('express').Router();
const notifications = require('../../helper/notifications');
const Networks = require('./networks.model');
const Notifications = require('../notifications/notifications.model');
const User = require('../user/user.model');

router.get('/admins', async (req, res) => {
  try {
    console.log('GET /networks/admins called', req.query);
    let admins = await Networks.findOne({ _id: req.query.networkId, 'members.isAdmin': true })
      .select('members -_id')
      .populate('members.memberId', 'firstName lastName profiePicture -_id');
    let owner = await Networks.findOne({ _id: req.query.networkId }).select('owner -_id')
      .populate('owner', 'firstName lastName profilePicture -_id');
    res.status(200).send({
      success: true,
      admins,
      owner
    });
  } catch (err) {
    console.log('error in GET /networks/admins', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log('GET /networks called', req.query);
    let network = await Networks.findOne({ _id: req.query.networkId })
      .populate('owner', 'firstName lastName profilePicture')
      .populate('admin', 'firstName lastName profilePicture')
      .populate('members.memberId', 'firstName lastName profilePicture')
      .populate('messages.sentBy', 'firstName lastName profilePicture')
      .populate('messages.inspired', 'firstName lastName profilePicture')
      .populate('messages.responses.user', 'firstName lastName profilePicture');
    console.log('got network details', network);
    res.status(200).send({
      success: true,
      network
    });
  } catch (err) {
    console.log('got error in GET /networks/content', err);
    res.status(500).send({
      success: false,
      response: 'Failed to get network detail'
    });
  }
});

router.get('/messages', async (req, res) => {
  try {
    console.log('GET /networks/messages called', req.query);
    let messages = await Networks.findOne({ _id: req.query.networkId })
    .populate({ path: 'messages.sentBy', select: 'firstName lastName profilePicture' })
    .populate({ path: 'messages.responses.user', select: 'firstName lastName profilePicture'})
    .select('messages')
    console.log('got network messages', messages);
    res.status(200).send({
      success: true,
      messages
    });
  } catch (err) {
    console.log('got error in GET /networks/messages', err);
    res.status(500).send({
      success: false,
      response: 'Failed to get network messages'
    });
  }
});

router.put('/edit', async (req, res) => {
  try {
    console.log('PUT /networks/edit called', req.query);
    let response  = await Networks.updateOne({ _id: req.query.networkId }, {
      name: req.query.name,
      networkIcon: req.query.picture
    });
    console.log('group edited response', response);
    res.status(200).send({
      success: true,
      response: 'Updated'
    });
  } catch(err) {
    console.log('got error in /networks/edit', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});


router.put('/exit', async (req, res) => {
  try {
    console.log('PUT /networks/exit called', req.body);
    let response = await Networks.updateOne({ _id: req.body.networkId }, {
      $pull: {
        members: { memberId: req.body.userId }
      }
    });
    let deleteRequests = await Notifications.deleteOne({ $and: [{sender: req.body.userId}, {network: req.body.networkId}] });
    console.log('request deleted', deleteRequests);
    if(response.matchedCount == 1 && response.modifiedCount == 0) {
      return res.status(500).send({
        success: false,
        response: 'No user exist'
      });
    }
    res.status(200).send({
      success: true,
      response
    });
  } catch (err) {
    console.log('error in PUT /networks/exit', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/admin-request', async (req, res) => {
  try {
    console.log('PUT /networks/admin-request called', req.body);
    let response = await Networks.updateOne({ _id: req.body.networkId }, {
      $set: {
        'members.$[element].isAdmin': req.body.isAccepted,
      }
    }, {
      arrayFilters: [{ 'element.memberId': req.body.memberId }]
    }
    );
    console.log('admin request response', response);
    let deleteNotification = await Notifications.deleteOne({ _id: req.body.notificationId });
    console.log('delete notification response', deleteNotification);
    res.status(200).send({
      success: true,
      response: 'Admin request processed'
    });
  } catch (err) {
    console.log('error in PUT /networks/admin', err);
    res.status(500).send({
      success: false,
      response: 'Failed to process admin request'
    })
  }
});

// Members requesting to be network admin
router.put('/role-request', async (req, res) => {
  try {
    console.log('PUT /networks/role-request called', req.query);
    let checkRequest = await Notifications.findOne({ $and: [{network: req.query.networkId}, {sender: req.query.userId}] });
    if(checkRequest) {
      return res.status(500).send({
        success: false,
        response: 'Request already sent'
      });
    } else {
      let network = await Networks.findOne({ _id: req.query.networkId });
      let user = await User.findOne({ _id: req.query.userId });
      let networkOwner = await User.findOne({ _id: network.owner });
      let data = {
        network: network._id,
        receiver: networkOwner,
        sender: user,
        category: 'Network Admin Request',
        title: 'Network Admin Request',
        msg: `${user.firstName} ${user.lastName} requested for admin role in ${network.name}`,
      }
  
      let response = await notifications.sendNotification(data);
      return res.status(200).send({
        success: true,
        response: 'Request sent.'
      });
    }

  } catch(err) {
    console.log('error in PUT /networks/role-request', err);
    res.status(500).send({
      success: false,
      response: 'Failed to process request'
    });
  }
});

router.put('/join', async(req, res) => {
  try{
    console.log('PUT /networks/join called', req.query);
    let checkMember = await Networks.findOne({ $and: [{_id: req.query.networkId}, { 'members.memberId': req.query.userId }] });
    if(checkMember) {
      return res.status(500).send({
        success: false,
        response: 'User is already a member of network'
      });
    }
    let checkPrevReq = await Notifications.findOne({ $and: [{network: req.query.networkId}, {sender: req.query.userId}]});
    if(!checkPrevReq) {
      let network = await Networks.findOne({ _id: req.query.networkId });
      let networkOwner = await User.findOne({ _id: network.owner });
      let sender = await User.findOne({ _id: req.query.userId });
      let data = {
        network: req.query.networkId,
        receiver: networkOwner,
        sender,
        category: 'Join Network',
        message: 'Join Network Request',
        title: 'Join Network Request',
        msg: `${sender.firstName} ${sender.lastName} requested to join ${network.name} network`,
      };
      await notifications.sendNotification(data);
      return res.status(200).send({
        success: true,
        response: 'Request sent'
      });
    } else {
      res.status(500).send({
        success: true,
        response: 'Request already sent'
      });
    }

  } catch(err) {
    console.log('error in PUT /networks/join', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.put('/process-join-request', async (req, res) => {
  try {
    console.log('PUT /networks/process-join-request', req.query);
    let notification = await Notifications.findOne({ _id: req.query.notificationId });
    if(notification) {
      if(req.query.isAccepted == 'true') {
        console.log('inside isAccepted == true', req.query.isAccepted);
        console.log('notification', notification);
        let memberExist = await Networks.findOne({ $and: [{_id: notification.network}, {'members.memberId': notification.sender.toString()}] });
        console.log('member exist', memberExist)
        if(memberExist) {
          let deleteNotification = await Notifications.deleteOne({ _id: req.query.notificationId });
          console.log('member already accepted', deleteNotification);
          return res.status(500).send({
            success: false,
            response: 'Member exist'
          });
        } else {
          let response = await Networks.updateOne({ _id: notification.network.toString() }, {
            $push: { members: {
              memberId: notification.sender.toString(),
              isAdmin: false
            } }
          });
          console.log('membre added', response);
          let notificationResponse = await Notifications.updateOne({ _id: req.query.notificationId }, {
            isSeen: true,
            isProcessed: true,
            isAccepted: true
          });
          console.log('network join request accepted notification response', notificationResponse);
          let deleteNotification = await Notifications.deleteOne({ _id: req.query.notificationId });
          console.log('network join request accepted', deleteNotification);
          return res.status(200).send({
            success: true,
            response: 'Member added'
          });
        }
      } else if(req.query.isAccepted == 'false') {
        let deleteNotification = await Notifications.deleteOne({ _id: req.query.notificationId });
        console.log('request to join network rejected', deleteNotification);
        return res.status(200).send({
          success: true,
          response: 'Request rejected'
        });
      }
    } else {
      return res.status(500).send({
        success: false,
        response: 'Request does not exist'
      });
    }
  } catch(err) {
    console.log('got error in process-join-request', err);
    res.status(500).send({
      success: false,
      response: 'Internal server error'
    });
  }
});

router.put('/enter', async (req, res) => {
  try {
    console.log('PUT /networks/enter called', req.query);
    let checkMember = await Networks.findOne({ $and: [{ _id: req.query.networkId }, { 'members.memberId': req.query.userId }] });
    if(!checkMember) {
      let addToNetwork = await Networks.updateOne({ _id: req.query.networkId }, {
        $push: {
          members: { memberId: req.query.userId, isAdmin: false }
        }
      });
      console.log('add to network response', addToNetwork);
      res.status(200).send({
        success: true,
        response: 'Added to network'
      });
    } else {
      res.status(500).send({
        success: false,
        response: 'Already a member'
      });
    }
  } catch (err) {
    console.log('error in PUT /networks/enter', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('POST /networks/ called', req.body);
    let network = await Networks.create(req.body);
    res.status(200).send({
      success: true,
      network
    });
  } catch (err) {
    console.log('error in POST /auth/networks', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/members', async (req, res) => {
  try {
    console.log('POST /networks/members called', req.body);
    let members = req.body.members;
    for(let i = 0; i < members.length; i++) {
      let updateNetwork = await Networks.updateOne({
        _id: req.body.networkId,
        'members.memberId': { $ne: members[i].memberId }
      }, {
        $addToSet: { members: members[i] }
      });
      console.log('adding member in network response', updateNetwork);
    }
    // let response;
    // if (updateNetwork.matchedCount === 0) {
    //   response = 'Member already exist'
    // } else {
    //   response = 'Member Added'
    // }
    res.status(200).send({
      success: true,
      response: 'Memer Added'
    });
  } catch (err) {
    console.log('got error in POST /networks/members', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.post('/message', async (req, res) => {
  try {
    console.log('POST /networks/message called', req.body);
    let response = await Networks.updateOne({ _id: req.body.networkId }, {
      $push: {
        messages: {
          sentBy: req.body.message.sentBy,
          message: req.body.message.message,
          sendTime: new Date()
        }
      }
    });
    console.log('sent message in network response', response);
    res.status(200).send({
      success: true,
      response: 'Message sent in network'
    });
  } catch (err) {
    console.log('error in POST /notifications/message', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

router.delete('/', async (req, res) => {
  try {
    console.log('DELETE /networks called', req.query);
    let network = await Networks.findOne({ _id: req.query.networkId });
    let owner = JSON.stringify(network.owner);
    if (owner === JSON.stringify(req.query.userId)) {
      let response = await Networks.deleteOne({ _id: req.query.networkId });
      console.log('network deleted', response);
      res.status(200).send({
        success: true,
        response
      });
    } else {
      console.log('unauthorized');
      res.status(401).send({ success: false });
    }
  } catch (err) {
    console.log('error in DELETE /networks/:id', err);
  }
});

router.put('/make-admin', async (req, res) => {
  try {
    let isAdmin = false;
    console.log('PUT /networks/make-admin called', req.query);
    let network = await Networks.findOne({ _id: req.query.networkId });
    console.log('network', network.members)
    if(network.owner.toString() == req.query.adminId) {
      console.log('inside if owner')
      let updateNetwork = await Networks.updateOne({ _id: req.query.networkId }, {
        $set: {
          'members.$[element].isAdmin': true,
        }
      }, {
        arrayFilters: [{ 'element.memberId': req.query.memberId }]
      });
      isAdmin = true;
      console.log('member added in if', updateNetwork);
    } else {
      for(let i = 0; i < network.members.length; i++) {
        console.log('inside else for')
        if(network.members[i].memberId.toString() == req.query.adminId && network.members[i].isAdmin == true) {
          let updateNetwork = await Networks.updateOne({ _id: req.query.networkId }, {
            $set: {
              'members.$[element].isAdmin': true,
            }
          }, {
            arrayFilters: [{ 'element.memberId': req.query.memberId }]
          });
          console.log('member added in else', updateNetwork);
          isAdmin = true;
          break;
        }
      }
    }
    if(isAdmin) {
      let networkAdmin = await User.findOne({ _id: req.query.adminId });
      let network = await Networks.findOne({ _id: req.query.networkId });
      let receiver = await User.findOne({ _id: req.query.memberId });
      let data = {
        receiver,
        sender: networkAdmin,
        title: 'Made an admin',
        msg: `${networkAdmin.firstName} ${networkAdmin.lastName} made you admin of network "${network.name}"`,
        category: 'Make admin'
      }
      let sendNotificationResponse = await notifications.sendNotification(data);
      console.log('got send notification response', sendNotificationResponse);
      res.status(200).send({
        success: true,
        response: 'added as admin'
      });
    } else {
      res.status(500).send({
        success: false,
        response: 'Only admins can make others as admin'
      });
    }
  } catch(err) {
    console.log('got error in make admin endpoint', err);
    res.status(500).send({
      success: false,
      response: err
    });
  }
});

module.exports = router;