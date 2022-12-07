const router = require('express').Router();

const userRouter = require('./users/index');
const postRouter = require('./posts/index');
const postsRouter = require('./posts/posts');
const networksRouter = require('./Networks/networks');
const industryPlugsRouter = require('./industry-plugs/articles');
const AddUsers = require('./AddUsers/addUsers');
const Account = require('./Account/account')
const Term = require('./App Terms/terms')

router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/all_posts', postsRouter);
router.use('/networks', networksRouter);
router.use('/industry-plugs', industryPlugsRouter);
router.use('/add_Users', AddUsers)
router.use('/account', Account)
router.use('/term', Term)

module.exports = router;
