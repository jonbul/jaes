const mongoose = require('mongoose');
const { Int32 } = require('mongodb');
const Layer = require('./layer');

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
        layers: [Layer]
    }
);

module.exports = mongoose.model('paintingProject', PaintingProject);