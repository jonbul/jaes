import mongoose from 'mongoose';
import Shape from './shape.js';

const Layer = new mongoose.Schema(
    {
        name: String,
        visible: Boolean,
        shapes: [Shape]
    }
)


export default Layer;