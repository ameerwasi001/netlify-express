const mongoose = require('mongoose');

let UserListSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
});

const UserList = mongoose.model('user_list', UserListSchema);

module.exports = UserList;