const router = require('express').Router();
const Chat = require('./chat.model');
const aws = require('aws-sdk');

const config = {
    region: 'eu-west-2',
    accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
    secretAccessKey: '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',
    signatureVersion: 'v4',
  }

// Getting all chats of a logged in user
router.get('/user', async (req, res) => {
  console.log('GET /chat/user called', req.query);
  try {
    let chats = await Chat.find({ $or: [{sentBy: req.query.userId}, {sentTo: req.query.userId}] })
      .populate('sentBy', '_id firstName lastName email profilePicture')
      .populate('sentTo', '_id firstName lastName email profilePicture');
    console.log('got find chats response', chats);
    return res.status(200).send({
      success: true,
      chats
    });
  } catch (err) {
    console.error('got error in get chat endpoint', err);
    return res.status(500).send({ err: err });
  }
});

// Getting chat by chat id
router.get('/', async (req, res) => {
  console.log('GET /chat/ called', req.body);
  try {
    let chat = await Chat.findOne({ _id: req.body.chatId })
      .populate('sentBy', '_id firstName lastName profilePicture')
      .populate('sentBy', '_id firstName lastName profilePicture');
    console.log('got find chat response', chat);
    return res.status(200).send({ chat });
  } catch (err) {
    console.error('got error in get chat endpoint', err);
    return res.status(500).send({ err: err });
  }
});

router.get('/by-users', async (req, res) => {
  console.log('GET /chat/by-users called', req.query);
  try {
    // let chat = await Chat.findOne({ $and: [{ sentBy: req.query.sender }, { sentTo: req.query.receiver }] });
    let chat = await Chat.findOne({ $or: [
      { $and: [{ sentBy: req.query.sender }, { sentTo: req.query.receiver }] }, 
      { $and: [{ sentBy: req.query.receiver }, { sentTo: req.query.sender }] }
    ] });
    console.log('got chats by user id response', chat);
    return res.status(200).send({
      success: true,
      chat
    });
  } catch (err) {
    console.error('got error in get chats by user id endpoint', err);
    return res.status(500).send({
      msg: 'Failed to get chats'
    });
  }
});

router.put('/seen', async (req, res) => {
  try {
    console.log('PUT /chat/seen called', req.query);
    let response = await Chat.updateOne({ _id: req.query.chatId }, {
        'messages.$[element].isSeen': true,
    }, {
      arrayFilters: [{ 'element._id': req.query.messageId }]
    }
    );
    console.log('response', response);
    res.status(200).send({
      success: true,
      response: 'Marked as seen'
    });
  } catch(err) {
    console.log('got error in PUT /chat/seen', err);
    res.status(500).send({
      success: false,
      response: 'Failed in marking seen status of chat'
    })
  }
})

router.post('/create', async (req, res) => {
  try {
    console.log('POST /chat/create called', req.body);
    if(!req.body.sentTo) {
      res.status(500).send({
        success: false,
        response: 'Receiver Id missing'
      });
      return;
    }
    if(!req.body.sentBy) {
      res.status(500).send({
        success: false,
        response: 'Sender Id missing'
      });
      return;
    }
    if(req.body.sentBy && req.body.sentTo) {
      let createChatResponse = await Chat.create({
        sentBy: req.body.sentBy,
        sentTo: req.body.sentTo,
        messages: []
      });
      console.log('chat created', createChatResponse);
      res.status(200).send({
        success: true,
        response: createChatResponse._id
      });
    } else {
      res.status(500).send({
        success: false,
        response: 'Data missing'
      });
    }
  } catch(err) {
    console.log('got error while creating chat', err);
    res.status(500).send({
      success: false,
      response: []
    });
  }
});

router.delete('/delete_chat', async (req, res) => {

  try {

    const {chatId} = req.body

    if(chatId !== '' && chatId){

      const s3 = new aws.S3(config)

      const chat = await Chat.findById(chatId)

      chat.messages.map(msg => {
        if(msg.attachments.length > 0){
          msg.attachments.map(async (img) => {
            let filename = img.location.split('/').pop()
  
            await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()
          })
        }
      })

      await Chat.deleteOne({_id: chatId})

      res.status(200).send({
        success: true,
        response: 'Chat Deleted Successfully'
      });

    }else{

      res.status(500).send({
        success: false,
        response: 'Invalid Chat Id'
      });
    }
    
  } catch (error) {
    console.log('got error while deleting chat', error);
    res.status(500).send({
      success: false,
      response: []
    });
  }

})

// router.post('/send-message', async (req, res) => {
//   try {
//     console.log('POST /chat/send-message called', req.body);
//     let message = {
//       sentBy: req.body.sentBy,
//       sentTo: req.body.sentTo,
//       body: req.body.body,
//       attachments: req.body.attachments,
//       sendTime: new Date()
//     };
//     let updateChat = await Chat.updateOne({ _id: req.body.chatId }, {
//       $push: { messages: message }
//     });
//     let chat = await Chat.findOne({
//       _id: req.body.chatId
//     });
//     console.log('chat', chat);
//     app.
//     app.emit(`message_sent:${req.body.chatId}`, chat);
//     res.status(200).send({
//       success: true,
//       response: 'Message sent'
//     });
//   } catch (err) {
//     console.log('got error in sending message', err);
//     res.status(500).send({
//       success: 500,
//       response: err
//     });
//   }
// });

module.exports = router;
