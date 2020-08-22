const mongoose = require('mongoose');
const { Int32 } = require('mongodb');
const Shape = require('./shape');

const Layer = new mongoose.Schema(
    {
        name: String,
        visible: Boolean,
        shapes: [Shape]
    }
)


module.exports = mongoose.model('layer', Layer);