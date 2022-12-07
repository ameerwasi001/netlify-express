const router = require('express').Router();
const Notifications = require('../../notifications/notifications.model');
const User = require('../user.model');

router.post('/', async (req, res) => {
  try {
    console.log('POST /connect-requests/ called', req.body);
    let requestExist = await Notifications.findOne({
      $or: [
        { $and: [{ sender: req.body.senderId }, { receiver: req.body.receiverId }] },
        { $and: [{ sender: req.body.receiverId }, { receiver: req.body.senderId }] }
      ]
    });
    if (requestExist) {
      return res.status(500).send({
        success: false,
        response: 'Request exist'
      });
    } else {
      let senderUser = await User.findOne({ _id: req.body.senderId });
      let createRequest = await Notifications.create({
        sender: req.body.senderId,
        receiver: req.body.receiverId,
        notification: {
          category: 'Connection Request',
          message: `${senderUser.firstName} ${senderUser.lastName} wants to connect with you.`
        }
      });
      console.log('request created', createRequest);
      res.status(200).send({
        success: true,
        response: 'Request sent'
      })
    }
  } catch(err) {
    console.log('got error in POST /connect-requests/', err);
    res.status(500).send({
      success: false,
      Response: err
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    console.log('GET /connect-requests/status called', req.query);
    let request = await Notifications.findOne({
      $or: [
        { $and: [{ sender: req.query.userId }, { receiver: req.query.artistId }] },
        { $and: [{ sender: req.query.artistId }, { receiver: req.query.userId }] }
      ]
    });
    console.log('request in status', request)
    if (request) {
      if (request.isProcessed == false && request.sender == req.query.userId) {
        console.log('Your request is in pending');
        return res.status(200).send({
          success: true,
          response: 'pending'
        });
      } else if (request.isProcessed == false && request.sender == req.query.artistId) {
        // If logged in user have received request from other person, i.e Artist
        console.log('You have a connection request from user');
        return res.status(200).send({
          success: true,
          response: 'connection request'
        });
      } 
      // else if (request.isProcessed == true && request.isAccepted == true && request.sender == req.query.userId) {
      //   console.log('Your request is accepted');
      //   res.status(200).send({
      //     success: true,
      //     response: 'accepted'
      //   });
      // } else if (request.isProcessed == true && request.isAccepted == false && request.sender == req.query.userId) {
      //   console.log('Your request is rejected');
      //   res.status(200).send({
      //     success: true,
      //     response: 'rejected'
      //   });
      // } else if (request.isProcessed == true && request.isAccepted == true && request.receiver == req.query.userId) {
      //   console.log('Your request is rejected');
      //   res.status(200).send({
      //     success: true,
      //     response: 'connected'
      //   });
      // } else if (request.isProcessed == true && request.isAccepted == false && request.receiver == req.query.userId) {
      //   console.log('Your request is rejected');
      //   res.status(200).send({
      //     success: true,
      //     response: 'not connected'
      //   });
      // }
    } else {
      let user = await User.findOne({ $and: [{ _id: req.query.userId }, { connections: req.query.artistId }] });
      let artist = await User.findOne({ $and: [{ _id: req.query.artistId }, { connections: req.query.userId }] });
      if (user && artist) {
        console.log('user', user);
        console.log('artist', artist);
        console.log('both are connected');
        return res.status(200).send({
          success: true,
          response: 'connected'
        });
      } else if (!user || !artist) {
        console.log('user', user);
        console.log('artist', artist);
        console.log('not connected');
        return res.status(200).send({
          success: true,
          response: 'not connected'
        });
      }
    }
  } catch (err) {
    console.log('got error in GET /connect-requests/status', err);
    res.status(500).send({
      succesS: false,
      response: err
    });
  }
});

// Process a connection request
router.put('/process', async (req, res) => {
  try {
    console.log('PUT /connect-requets/process called', req.query);
    // Get Request from db
    let request = await Notifications.findOne({
      $and: [{ receiver: req.query.userId }, { sender: req.query.artistId }]
    });
    if (!request) {
      return res.status(500).send({
        success: false,
        response: 'No request exist'
      })
    } else if (request) {
      console.log('request', request);
      let toDelete = await Notifications.findOne({
        $and: [{ receiver: req.query.userId }, { sender: req.query.artistId }]
      });
      let deleteRequest = await Notifications.deleteOne({ _id: toDelete._id });
      console.log('deleteRequest response', deleteRequest);
      if(JSON.parse(req.query.isAccepted)) {
        let updateUser = await User.updateOne({ _id: req.query.userId }, {
        $addToSet: {
          connections: req.query.artistId
        }
      });
      console.log('add connection in user', updateUser);
      let updateArtist = await User.updateOne({ _id: req.query.artistId }, {
        $addToSet: {
          connections: req.query.userId
        }
      });
      console.log('add connection in artist', updateArtist);
    }
      console.log(`Request is ${req.query.isAccepted}`);
      return res.status(200).send({
        success: true,
        response: JSON.parse(req.query.isAccepted) == true ? 'Request accepted' : 'Request rejected'
      });
    }
  } catch (err) {
    console.log('got error in /connect-requests/process', err);
    return res.status(500).send({
      success: false,
      response: 'Failed to process request'
    });
  }
});

router.put('/unfriend', async (req, res) => {
  try {
    console.log('PUT /connect-requests/unfriend called', req.query);
    let removeUser = await User.updateOne({ _id: req.query.userId }, {
      $pull: {
        connections: req.query.artistId
      }
    });
    console.log('got removeUser response', removeUser);
    let removeArtist = await User.updateOne({ _id: req.query.artistId }, {
      $pull: {
        connections: req.query.userId
      }
    });
    console.log('got removeArtist response', removeArtist);
    res.status(200).send({
      status: true,
      response: 'Unfriend succesfull'
    });
  } catch(err) {
    console.log('got error in PUT /connect-requests/unfriend', err);
    res.status(500).send({
      success: false,
      response: 'Failed to unfriend'
    });
  }
})

router.delete('/cancel', async (req, res) => {
  try {
    console.log('PUT /connect-requests/cancel called', req.query);
    let deleteResponse = await Notifications.deleteOne({
      $and: [{ receiver: req.query.artistId }, { sender: req.query.userId }]
    });
    console.log('got delete request response', deleteResponse);
    res.status(200).send({
      success: true,
      response: 'Request cancelled'
    });
  } catch(err) {
    console.log('got error in PUT /connect-requests/cancel', err);
    res.status(500).send({
      success: false,
      response: 'Failed to cancel request'
    });
  }
});

module.exports = router;