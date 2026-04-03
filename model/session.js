import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Session = new mongoose.Schema(
    {
        admin: Boolean,
        user_id: String,
        sessionTimestamp: Number,
        persistant: Boolean,
        token: String
    }
)


export default mongoose.model('session', Session);