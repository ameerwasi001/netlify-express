const router = require('express').Router();
const User = require('../../routes/user/user.model')
const UserList = require('./usersListModel')

router.get('/', async (req, res) => {
    try {
        console.log('GET in GET /admin/addUsers/');
        const users = await User.find({})

        let list = []

        users.map(user => {
            list.push(user._id)
        })

        UserList.create({users: list})

        res.status(200).send({
            success: true,
            users: users
        });

        
    } catch (error) {
        console.log('error in GET /admin/addUsers/', err);
        res.status(500).send({
        success: false,
        response: err
        });
    }
})

module.exports = router;