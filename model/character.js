const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const Character = new mongoose.Schema(
    {
        userId: String,
        name: String,
        structure: [mongoose.Schema.Types.Mixed],
        x: Integer,
        y: Integer,
        height: Integer,
        width: Integer
    }
)

module.exports = mongoose.model('character', Character);