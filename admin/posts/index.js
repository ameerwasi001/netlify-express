const router = require('express').Router();
const Posts = require('../../routes/user/posts/posts.model');

router.get('/:userId', async (req, res) => {
  try {
    console.log('GET /admin/posts/:userId called', req.params);
    let posts = await Posts.find({ user: req.params.userId });
    // console.log('got admin posts response', posts);
    res.status(200).send({
      success: true,
      posts
    });
  } catch (err) {
    console.log('error in GET /admin/posts', err);
    res.status(500).send({
      succes: false,
      response: err
    });
  }
});

router.put('/block/:postId/:toBlock', async (req, res) => {
  try {
    console.log('PUT /admin/posts/block/:postId called', req.params.toBlock);
    let response = await Posts.updateOne({ _id: req.params.postId }, { isBlocked: !(JSON.parse(req.params.toBlock)) });
    let getPost = await Posts.findOne({ _id: req.params.postId });
    let userId = getPost.user;
    let posts = await Posts.find({ user: userId });
    console.log('got block post response', response);
    res.status(200).send({
      success: true,
      posts
    });
  } catch (err) {
    console.log('error in PUT /admin/posts/block/', err);
    res.status(500).send({
      succes: false,
      response: err
    });
  }
});

module.exports = router;