const mongoose = require('mongoose');
const { Int32 } = require('mongodb');

const Shape = new mongoose.Schema(
    {
        desc: String,
        x: Number,
        y: Number,
        points: [{
            x: Number,
            y: Number,
        }],
        width: Number,
        height: Number,
        radius: Number,
        radiusX: Number,
        radiusY: Number,
        startAngle: Number,
        endAngle: Number,
        backgroundColor: String,
        borderColor: String,
        borderWidth: Number,
        rorationInDegrees: Number,
    }
)


module.exports = mongoose.model('shape', Shape);