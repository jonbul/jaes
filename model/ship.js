const mongoose = require('mongoose');
const Ship = new mongoose.Schema(
    {
        name: String,
        layers: [{
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
        }],
    }
)

module.exports = mongoose.model('ship', Ship);