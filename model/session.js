import mongoose from 'mongoose';

const SESSIONDURATION = 30 * 24 * 3600000; // 30 days in milliseconds

function getNewBearerToken() {
    return [...Array(60)].map(() => Math.random().toString(36)[2]).join('');
}

const Session = new mongoose.Schema(
    {
        admin: Boolean,
        userId: String,
        sessionTimestamp: Number,
        persistent: Boolean,
        token: { type: String, default: getNewBearerToken },
        loggedOut: { type: Boolean, default: false },
        expirationTime: { type: Date, default: () => new Date(Date.now() + SESSIONDURATION) }
    }
)

Session.methods.isExpired = function () {
    if (this.persistent) return false;
    return this.expirationTime < Date.now() || this.loggedOut;
}

Session.methods.refreshToken = async function () {
    if (!this.persistent && !this.isExpired()) {
        this.expirationTime = new Date(Date.now() + SESSIONDURATION);
        this.token = getNewBearerToken();
        await this.save();
    }
    return this.token;
}

export default mongoose.model('session', Session);