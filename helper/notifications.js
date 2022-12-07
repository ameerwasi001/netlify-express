const admin = require('firebase-admin');
const Notifications = require('../routes/notifications/notifications.model');
var FCM = require('fcm-node');
var serverKey = 'AAAA6Ehm0K8:APA91bFUla-jfO4SPtvcRA65B4QzI1IDKgpHH4dMMwl0SumNEBCNrW3GENwMv3Icg4h8zRNvK6_ftBJ37SsxNmp3RQcEPABTKT2WiSUV_NPvBzqOmPzF8_903z5r6YusIl186PmPU7aT'; //put your server key here
var fcm = new FCM(serverKey);

async function sendNotification(data) {
  var message = {
    to: data.receiver.deviceToken,
    // 'dLkJ5azYTX-_EukYAs33lr:APA91bFK6Vzs1jVqkD0Wi02-xNHQBAfGhM9vJW5Ofxvr-VVl2bXNRqrhZ_-fNkREF9Z8JomK6OrJ1V1LOsX6F4j61-_nXpNbKWfMF3hNaSy7zVP6ZdT6x2voF1VkhHZNvsXer-ZGotFL',
    notification: {
      title: data.title,
      body: data.msg
    }
  };
  fcm.send(message, function (err, response) {
    if (err) {
      console.log('failed to send notification', err);
      return 'Failed to send notification';
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
  let toSave;
  if (data.sender == 'admin') {
    toSave = {
      network: data?.network,
      post: data?.post,
      receiver: data.receiver._id,
      notification: {
        category: 'Admin Notification',
        message: data.category + ': ' + data.msg
      }
    };
  } else {
    toSave = {
      network: data?.network,
      post: data?.post,
      receiver: data.receiver._id,
      sender: data.sender._id,
      notification: {
        category: data.category,
        message: data.msg
      }
    };
  }
  try {
    if(data?.post != null) {
      let notificationExist = await Notifications.findOne({ $and: [{ sender: data.sender._id }, { post: data.post }, { 'notification.category': data.category }]});
      if(!notificationExist) {
        let saveNotificationResponse = await Notifications.create(toSave);
        if (saveNotificationResponse) {
          console.log('Notification saved');
          return 'Notification saved'
        }
      } else {
        let deletePrevNotification = await Notifications.deleteOne({ _id: notificationExist._id });
        let saveNotificationResponse = await Notifications.create(toSave);
        if (saveNotificationResponse) {
          console.log('Notification saved');
          return 'Notification saved'
        }
      }
    } 
    
    let saveNotificationResponse = await Notifications.create(toSave);
    if (saveNotificationResponse) {
      console.log('Notification saved');
      return 'Notification saved'
    }
  } catch (err) {
    console.log('Error saving notification', err);
    return 'Error saving notification';
  }
}

module.exports = {
  sendNotification
}
