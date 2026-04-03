import mongoose from 'mongoose';

const Session = new mongoose.Schema(
    {
        admin: Boolean,
        userId: String,
        sessionTimestamp: Number,
        persistant: Boolean,
        token: String,
        loggedOut: { type: Boolean, default: false }
    }
)


export default mongoose.model('session', Session);