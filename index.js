require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const serverless = require('serverless-http');
const moment = require("moment")

// let secret_key = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';
let secret_key = 'sk_test_51KJwuOEKMdOQ4XcwGAZjMsXKMV7Vmvx6nXrK4WyIxHCNhZYhKGYI85ChWQj7KrChDVmVEJaoRfMdOQhsA3OwVq0X00NmG1BYV6';

const stripe = require('stripe')(secret_key);

const passport = require("./passport");
const User = require("./routes/user/user.model");
const notifications = require("./helper/notifications");
const Chat = require('./routes/user/chat/chat.model');

const adminRouter = require("./admin/index");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user/index");
const notificationsRouter = require("./routes/notifications/index");
const commentsRouter = require("./routes/user/comments/index");
const chatRouter = require("./routes/user/chat/index");
const postsRouter = require("./routes/user/posts/index");
const collectionsRouter = require("./routes/user/collections/index");
const networksRouter = require("./routes/networks/index");
const articlesRouter = require("./routes/industry-plugs/articles/index");
const requestsRouter = require("./routes/user/requests/index");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

const PORT = process.env.PORT;

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/MakingMedia",
  { useNewUrlParser: true, useUnifiedTopology: true },
  function () {
    console.log("Database connected");
  }
);

app.get("/", (_req, res) => res.send("Express Server"));

app.get("/video", (req, res) => {
  // console.log('req.headers', req.headers);
  // console.log('req.headers.range', req.headers.range);
  // const range = req.headers.range;
  // if(!range) res.status(400).send("Requires Range Header");
  const videoPath = "https://makingmedia.s3.eu-west-2.amazonaws.com/apheavyvideo.mp4";
  // const videoSize = fs.statSync("cup.mp4").size;
  // const CHUNK_SIZE = 10 ** 6;
  // const start = Number(range.replace(/\D/g, ""));
  // const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  // const contentLength = end -start + 1;
  // const headers = {
  //   "Content-Range": `bytes ${start}-${end}/${videoSize}`,
  //   "Accept-Ranges": "bytes",
  //   "Content-Length": contentLength,
  //   "Content-Type": "video/mp4",
  // };
  // res.writeHead(206, headers);
  // const videoStream = fs.createReadStream(videoPath);
  // videoStream.pipe(res);
  // res.sendFile(__dirname + '/video2.mp4')
  res.sendFile(__dirname + '/apheavyvideo.mp4')
});

app.post('/pay', async(req, res) => {
  try {
    console.log('POST /pay called', req.body);

    // First create token with card information
    let body = {
      card: {
        number: req.body.card?.number,
        exp_month: req.body.card?.expiryMonth,
        exp_year: req.body.card?.expiryYear,
        cvc: req.body.card?.cvv
      }
    };
    let token = await stripe.tokens.create(body);

    // need amount currency and token

    let chargeBody = {
      amount: (req.body.amount * 100),
      currency: req.body.currency,
      source: token.id,
      description: 'payment for trial class',
    };
    let chargeResponse = await stripe.charges.create(chargeBody);
    console.log('got charge response', chargeResponse)
    return res.status(200).send({
      success: true,
      chargeResponse
    });
  } catch(err) {
    console.log('got error in POST /pay', err);
    return res.status(500).send({
      success: false,
      response: 'Error in payment'
    });
  }
});

app.use("/admin", adminRouter);
app.use("/auth", authRouter);
app.use("/user", passport.authenticate("jwt", { session: false }), userRouter);
// app.use("/user", userRouter);
// app.use("/chat", passport.authenticate("jwt", { session: false }), chatRouter);
app.use("/chat", chatRouter);
app.use(
  "/collections",
  passport.authenticate("jwt", { session: false }),
  collectionsRouter
);
app.use(
  "/comments",
  passport.authenticate("jwt", { session: false }),
  commentsRouter
);
app.use(
  "/posts",
  passport.authenticate("jwt", { session: false }),
  postsRouter
);
app.use(
  "/notifications",
  passport.authenticate("jwt", { session: false }),
  notificationsRouter
);
app.use(
  "/networks",
  passport.authenticate("jwt", { session: false }),
  networksRouter
);
app.use(
  "/articles",
  passport.authenticate("jwt", { session: false }),
  articlesRouter
);
app.use(
  "/connect-requests",
  // passport.authenticate("jwt", { session: false }),
  requestsRouter
);

// const http = require('http').Server(app);

// const server = http.listen(PORT || 5000, function () {
//   console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
// });

// const io = require('socket.io')(server);

// Uqba Changings

const http = require('http');

let server = http.createServer(app);
const io = require('socket.io')(server
//   , {
//   cors: {
//     origin: "http://localhost:3000",
//     credentials: true,
//   },
// }
);

// io.on('connect', (socket) => {
//   console.log('connected');

//   socket.on('join', async ({ sentBy, sentTo, chatId }) => {
//     console.log('sentBy: ', sentBy);
//     console.log('sentTo: ', sentTo);
//     console.log('chatId: ', chatId);
//     if(chatId) {
//       let chat = await Chat.findOne({ _id: chatId });
//       console.log('got chat: ', chat._id.toString());
//       socket.join(chat._id.toString());
//       io.to(chatId).emit('message', chat);
//     } else {
//       let createChat = await Chat.create({
//         sentBy: sentBy,
//         sentTo: sentTo
//       });
//       console.log('createChat', createChat);
//       console.log('createChat._id', createChat._id.toString());

//     }
//   });
// });



io.on('connect', (socket) => {
  console.log('a scoket connected');

  socket.on('join', async ({ sentBy, sentTo, chatId }, callback) => {
    // var clients = io.sockets.adapter.rooms
    console.log("User: ", sentBy, "Chat: ", chatId, "sentTo: ", sentTo);

    try {

      let isActive = false;

      if(io.sockets.adapter.rooms.has(chatId)){
        isActive = true
      }

      if(!chatId) {
        console.log('when user does not have chatId');
        let checkChat = await Chat.findOne({
          $or: [
            { $and: [{ sentBy: sentBy }, { sentTo: sentTo }] },
            { $and: [{ sentBy: sentTo }, { sentTo: sentBy }] }
          ]
        });
        console.log('checkChat on line no 157', checkChat);
  
        if(!checkChat) {
  
          let createChat = await Chat.create({ sentBy: sentBy, sentTo: sentTo });
          console.log('chat created', createChat);
  
          const chatId = createChat._id.toString();

          let chat = await Chat.findById(chatId).populate({
            path: 'sentBy',
            select: 'firstName lastName profilePicture lastActive'
          }).populate({
            path: 'sentTo',
            select: 'firstName lastName profilePicture lastActive'
          })
          chat['isActive'] = isActive
          chat['lastActive'] = moment().subtract(new Date - chat.sentTo.lastActive).calendar()  
          // This socket is joining to a room and room is created with chat id
          socket.join(chatId);

          // Now we are broadcasting message to the room which has above chat id
          io.to(chatId).emit("getAllMessages", chat);
  
        } else {
  
          console.log('when chat already exist', checkChat);
          if(checkChat.lastSender != sentBy) {
            await Chat.updateOne({ _id: checkChat._id }, {
              seen: true
            });
          }
  
          let chat = await Chat.findById(checkChat._id).populate({
            path: 'sentBy',
            select: 'firstName lastName profilePicture lastActive'
          }).populate({
            path: 'sentTo',
            select: 'firstName lastName profilePicture lastActive'
          })
          chat['isActive'] = isActive
          chat['lastActive'] = moment().subtract(new Date - chat.sentTo.lastActive).calendar()

          chat.messages.reverse();
          const chatId = chat._id.toString();
          socket.join(chatId);
          io.to(chatId).emit("getAllMessages", chat);
        }
  
      } else {
  
        console.log('when user sends a chat id');

        socket.join(chatId);
        
        let checkChatLastSender = await Chat.findOne({_id: chatId})
        
        if(checkChatLastSender?.lastSender != sentBy) {
          let markSeen = await Chat.updateOne({ _id: chatId }, {
            seen: true
          });
        }
       
        let chat = await Chat.findById(chatId).populate({
            path: 'sentBy',
            select: 'firstName lastName profilePicture lastActive'
          }).populate({
            path: 'sentTo',
            select: 'firstName lastName profilePicture lastActive'
          })
        chat['isActive'] = isActive
        chat['lastActive'] = moment().subtract(new Date - chat.sentTo.lastActive).calendar()        

        chat.messages.reverse();
        io.to(chatId).emit("getAllMessages", chat);
        console.log('at the last of join')
      }
  
      console.log("Joined", chatId);
      
    } catch (error) {
      console.log(error)
    }
    
    
    // callback();
  });

  socket.on('sendMessage', async (data) => {

    let isActive = false;

    if(io.sockets.adapter.rooms.has(data.chatId)){
      isActive = true
    }

    let message = {
      sentBy: data.sentBy,
      sentTo: data.sentTo,
      body: data.body,
      attachments: data.attachments,
      sendTime: new Date()
    }

    console.log(
      'data.chatId',
      data.chatId,
      "Message: ",
      message,
      "Message sentBy ",
      data.sentBy,
      "Message sentTo ",
      data.sentTo,
    );



    let pushMessages = await Chat.updateOne({ _id: data.chatId }, {
      $push: { messages: message },
      lastSender: data.sentBy,
      seen: false
    });
    console.log('got pushed messages response', pushMessages);


    let chat = await Chat.findById(data.chatId).populate({
        path: 'sentBy',
        select: 'firstName lastName profilePicture lastActive'
      }).populate({
        path: 'sentTo',
        select: 'firstName lastName profilePicture lastActive'
      })
    chat['isActive'] = isActive
    chat['lastActive'] = moment().subtract(new Date - chat.sentTo.lastActive).calendar() 
    if(chat.messages.length !== 0){
      chat.messages.reverse();
    }
    // console.log('find chat to send back: ', chat);

    console.log('socket.chatId which is being emitted before message',data.chatId)

    io.to(data.chatId).emit("getAllMessages", chat);
    // console.log('Message added and "message" event emiited: ', chat);
  });

  socket.on('deleteMessage', async (data) => {

    const {chatId, messageId} = data

    try{

      let isActive = false;

      if(io.sockets.adapter.rooms.has(chatId)){
        isActive = true
      }

      if(!chatId || !messageId){

        console.log('Invalid Parameters')

      }else{

        let popMessages = await Chat.updateOne({_id: chatId}, {
          $pull: { 'messages': { _id: messageId } }
        })

        // console.log('Message delete response :', popMessages)

        let chat = await Chat.findById(chatId).populate({
            path: 'sentBy',
            select: 'firstName lastName profilePicture lastActive'
          }).populate({
            path: 'sentTo',
            select: 'firstName lastName profilePicture lastActive'
          })
        chat['isActive'] = isActive
        chat['lastActive'] = moment().subtract(new Date - chat.sentTo.lastActive).calendar() 

        if(chat.messages.length !== 0){
          chat.messages.reverse();
        }
        
        // console.log('find chat to send back: ', chat);

        console.log('socket.chatId which is being emitted before message', chatId)

        io.to(chatId).emit("getAllMessages", chat);
        // console.log('Message added and "message" event emiited: ', chat);
      }

    }catch(err){
      console.log(err)
    }

  })

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});



server.listen(process.env.PORT || 5000, () => console.log(`server listening at ${process.env.PORT}`));


admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://makingmedia-a4255-default-rtdb.firebaseio.com",
});

module.exports.handler = serverless(app);