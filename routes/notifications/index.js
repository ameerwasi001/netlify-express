const router = require('express').Router();
const admin = require('firebase-admin');
const Notifications = require('./notifications.model');

router.get('/', async (req, res) => {
  try {
    console.log('GET /notifications/ called', req.query);
    let notifications = await Notifications.find({ $and: [{ receiver: req.query.userId }, { isProcessed: false }] })
      .populate('sender', 'firstName lastName profilePicture')
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 }).limit(30);
    console.log('got list of notifications', notifications);
    res.status(200).send({
      success: true,
      notifications
    });
  } catch (err) {
    console.log('error in GET /notifications/');
    res.status(500).send({
      success: false,
      msg: 'Failed to get list of notifications'
    });
  }
});

router.put('/seen', async (req, res) => {
  try {
    console.log('POST /notifications/seen', req.body);
    let response = await Notifications.updateOne({ _id: req.body.notificationId }, {
      isSeen: req.body.isSeen
    });
    console.log('marked notification seen status', response);
    res.status(200).send({
      success: true,
      msg: 'Marked notification seen status'
    })
  } catch (err) {
    console.log('error in POST /notifications/seen', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to mark notification seen status'
    })
  }
});

router.put('/process', async (req, res) => {
  try {
    console.log('POST /notifications/process', req.body);
    let response = await Notifications.updateOne({ _id: req.query.notificationId }, {
      isProcessed: true
    });
    console.log('marked notification isProcessed status', response);
    res.status(200).send({
      success: true,
      msg: 'Marked notification processed status'
    })
  } catch (err) {
    console.log('error in POST /notifications/process', err);
    res.status(500).send({
      success: false,
      msg: 'Failed to mark notification process status'
    })
  }
});

router.delete('/delete_notification', async (req, res) => {

  const {notifyId, userId} = req.body

  if(!notifyId || !userId || userId==='' || notifyId===''){
    res.status(500).send({
      success: false,
      msg: 'Invalid Parameters'
    })
  }else{
    try {
      
      let deletedNotification = await Notifications.deleteOne({$and: [{ _id: notifyId }, {receiver:userId}]});

      console.log('Delete reponse :', deletedNotification)

      let notifications = await Notifications.find({ $and: [{ receiver: userId }, { isProcessed: false }] })
      .populate('sender', 'firstName lastName profilePicture')
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 }).limit(30);
      console.log('got list of notifications', notifications);

      res.status(200).send({
        success: true,
        msg: 'Notifications deleted successfully!',
        notifications
      });  
    }catch (err) {
      console.log('error in POST /notifications/delete_notification', err);
      res.status(500).send({
        success: false,
        msg: 'Failed to delete notification'
      })
    }
  }  
})

module.exports = router;