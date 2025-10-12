const mongoose = require('mongoose');
const { Int32 } = require('mongodb');
const Shape = require('./shape');

const PaintingProject = new mongoose.Schema(
    {
        userId: {type: String, required: true},
        name: {type: String, required: true},
        dateCreated: Number,
        dateModified: Number,
        canvas: {
            width: Number,
            height: Number
        },
        layers: [
            {
                name: String,
                visible: Boolean,
                shapes: [{
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
                }]
            }
        ]
    }
);

module.exports = mongoose.model('paintingProject', PaintingProject);