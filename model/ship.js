const mongoose = require('mongoose');
const Layer = require('./layer');
const Ship = new mongoose.Schema(
    {
        name: String,
        layers: [Layer],
    }
)

module.exports = mongoose.model('ship', Ship);