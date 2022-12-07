const router = require('express').Router();
const Posts = require('../../routes/user/posts/posts.model');
const User = require('../../routes/user/user.model');
const { sendNotification } = require('../../helper/notifications')
const aws = require('aws-sdk');

const config = {
    region: 'eu-west-2',
    accessKeyId: 'AKIA4UJ2BONSUUVINZF6',
    secretAccessKey: '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',
    signatureVersion: 'v4',
  }

router.get('/get_repoted_posts', async (req, res) => {

    console.log('GET /admin/all_posts/get_repoted_posts called');

    try {
      let posts = await Posts.find({'reportedBy.0': {$exists: true}})
        .populate('user', 'firstName lastName profilePicture')
        .populate({ 
            path: 'comments',
            populate: {
                path: 'commenter',
                model: 'users',
                select: 'firstName lastName profilePicture'
            },
            select: 'comment commenter'
         })
        .populate('inspired', 'firstName lastName profilePicture')
        .populate('reportedBy', 'firstName lastName profilePicture')
        // .select('_id user post caption tags co')
  
      if(posts){
        res.status(200).send({
          success: true,
          posts
        });
      }else{
        res.status(500).send({
          succes: false,
        });
      }
      
    } catch (error) {
      console.log('error in GET /admin/all_posts/get_repoted_posts', error);
      res.status(500).send({
        succes: false,
        response: error
      });
    }
})

router.put('/approvePost', async (req, res) => {

    console.log('POST /admin/all_posts/approvePost called');

    const {postId} = req.body

    try {

        if(postId && postId !== ''){

            await Posts.updateOne({_id: postId}, {$set: {reportedBy: []}})

            let posts = await Posts.find({'reportedBy.0': {$exists: true}})
            .populate('user', 'firstName lastName profilePicture')
            .populate({ 
                path: 'comments',
                populate: {
                    path: 'commenter',
                    model: 'users',
                    select: 'firstName lastName profilePicture'
                },
                select: 'comment commenter'
            })
            .populate('inspired', 'firstName lastName profilePicture')
            .populate('reportedBy', 'firstName lastName profilePicture')

            if(posts){
                res.status(200).send({
                    success: true,
                    posts
                });
            }else{
                res.status(500).send({
                    succes: false,
                });
            }

        }else{
            res.status(500).send({
                success: false,
                message: 'Invalid Post ID',
            });
        }
        
    } catch (error) {
        console.log('error in POST /admin/all_posts/approvePost', error);
        res.status(500).send({
            succes: false,
            response: error
        });
    }
})

router.post('/deletePost', async (req, res) => {

    console.log('DELETE /admin/all_posts/deletePost called');

    const {postId, recieverId} = req.body

    try {

        if(postId && postId !== ''){

            const s3 = new aws.S3(config)

            const p = await Posts.findById(postId)

            let filename = p.post.location.split('/').pop()

            await s3.deleteObject({Bucket: 'makingmedia', Key: filename}).promise()

            await Posts.deleteOne({_id: postId})

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

                let posts = await Posts.find({'reportedBy.0': {$exists: true}})
                .populate('user', 'firstName lastName profilePicture')
                .populate({ 
                    path: 'comments',
                    populate: {
                        path: 'commenter',
                        model: 'users',
                        select: 'firstName lastName profilePicture'
                    },
                    select: 'comment commenter'
                })
                .populate('inspired', 'firstName lastName profilePicture')
                .populate('reportedBy', 'firstName lastName profilePicture')

                if(posts){
                    res.status(200).send({
                        success: true,
                        posts
                    });
                }else{
                    res.status(500).send({
                        succes: false,
                    });
                }
            }else{
                res.status(500).send({
                    success: false,
                    message: 'Invalid Reciever ID',
                });
            }

        }else{
            res.status(500).send({
                success: false,
                message: 'Invalid Post ID',
            });
        }

        
    } catch (error) {
        console.log('error in DELETE /admin/all_posts/deletePost', error);
        res.status(500).send({
            succes: false,
            response: error
        });
    }
})


module.exports = router;