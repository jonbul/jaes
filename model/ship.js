import mongoose from 'mongoose';
import Layer from './layer.js';

const Ship = new mongoose.Schema(
    {
        name: String,
        layers: [Layer],
    }
)

export default mongoose.model('ship', Ship);