import mongoose from 'mongoose';
import Layer from './layer.js';

const PaintingProject = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        dateCreated: Number,
        dateModified: Number,
        canvas: {
            width: Number,
            height: Number
        },
        layers: [Layer]
    }
);

export default mongoose.model('paintingProject', PaintingProject);