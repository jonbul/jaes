const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const User = new mongoose.Schema(
    {
        admin: Boolean,
        username: String,
        password: String,
        email: String,
        admin: Boolean,
        credits: Number,
        kills: Number,
        deaths: Number
    }
)

User.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

User.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('user', User);