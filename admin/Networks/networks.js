const router = require("express").Router();
const Network = require('../../routes/networks/networks.model');
const { sendNotification } = require('../../helper/notifications')
const User = require('../../routes/user/user.model');
const UserList = require('../AddUsers/usersListModel')
const aws = require('aws-sdk');

const config = {
    region: 'eu-west-2',
    accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
    secretAccessKey: '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',
    signatureVersion: 'v4',
  }

router.get('/all_networks', async (req, res) => {

    try {
        console.log('GET /admin/networks/all_networks called');

        let networks = await Network.find({})
        .populate('owner', 'firstName lastName profilePicture')
        .populate('admin', 'firstName lastName profilePicture')
        .populate('members.memberId', 'firstName lastName profilePicture')
        .populate('messages.sentBy', 'firstName lastName profilePicture')
        .populate('messages.inspired', 'firstName lastName profilePicture')
        .populate('messages.responses.user', 'firstName lastName profilePicture');

        res.status(200).send({
            success: true,
            networks,
        });

    } catch (error) {
        console.log("error in GET /networks/all", err);
        res.status(500).send({
            success: false,
            response: error,
        });
    }

})

router.post('/delete_network', async (req, res) => {

    const {networkId, recieverId} = req.body
    console.log('POST /admin/networks/delete_network called');

    try {
        if(!networkId, networkId === ''){
            res.status(500).send({
                success: false,
                message: 'Invalid Network ID',
            });
        }else{

            const s3 = new aws.S3(config)

            const n = await Network.findById(networkId)

            let filename = n.networkIcon.split('/').pop()

            await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()

            await Network.deleteOne({_id: networkId})

            if(!recieverId || recieverId === ''){

                let networks = await Network.find({})
                .populate('owner', 'firstName lastName profilePicture')
                .populate('members.memberId', 'firstName lastName profilePicture')
                .populate('messages.sentBy', 'firstName lastName profilePicture')
                .populate('messages.inspired', 'firstName lastName profilePicture')
                .populate('messages.responses.user', 'firstName lastName profilePicture');
                
                res.status(200).send({
                    success: true,
                    message: 'Network Deleted Successfully',
                    networks
                });
            }else{
                const receiver = await User.findById(recieverId)

                if(receiver){

                    const data = {
                        title: req.body.title,
                        msg: req.body.msg,
                        sender: 'admin',
                        category: 'Delete Network',

                        receiver: {
                            _id: recieverId,
                            deviceToken: receiver.deviceToken
                        }
                    }

                    console.log(data)

                    await sendNotification(data)

                    let networks = await Network.find({})
                    .populate('owner', 'firstName lastName profilePicture')
                    .populate('members.memberId', 'firstName lastName profilePicture')
                    .populate('messages.sentBy', 'firstName lastName profilePicture')
                    .populate('messages.inspired', 'firstName lastName profilePicture')
                    .populate('messages.responses.user', 'firstName lastName profilePicture');
                    
                    res.status(200).send({
                        success: true,
                        message: 'Network Deleted Successfully',
                        networks
                    });

                }else{
                    res.status(500).send({
                        success: false,
                        message: 'Invalid Reciever ID',
                    });
                }
            }
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
        });
    }

})

router.put('/add_network', async (req, res) => {

    try {

        const listDoc = await UserList.find()

        const List = listDoc[0]['users']

        let membersList = []

        List.map(id => {
            membersList.push({
                memberId: id
            })
        })


        await Network.create({
            admin: req.body.owner,
            name: req.body.name,
            privacy: 'global',
            networkIcon: req.body.image,
            members: membersList,
        });
        res.status(200).send({
            success: true,
            response: 'Article created'
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Server Error',
        });
    }
})





module.exports = router;
