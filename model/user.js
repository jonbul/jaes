import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const User = new mongoose.Schema(
    {
        admin: Boolean,
        username: String,
        password: String,
        email: String,
        credits: Number,
        kills: Number,
        deaths: Number
    }
)

User.methods.encryptPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

User.methods.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

export default mongoose.model('user', User);