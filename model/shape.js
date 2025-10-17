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
        rotation: Number,
        src: String,
        name: String,
        mirror: Boolean,
        projectId: String,
    }
)


module.exports = Shape;