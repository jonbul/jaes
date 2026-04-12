import Session from '../model/session.js';
import User from '../model/user.js';

const SESSIONITEMTYPES = {
    USER: 1,
    SESSION: 2
};

async function getSessionIfStillValid(token) {
    if (!token) return null;
    let userSession = await Session.findOne({ token, loggedOut: false });
    if (!userSession) return null;
    if (!userSession.isExpired()) return userSession;

    return null;
}

async function getUserSessionIfStillValid(token) {
    if (!token) return null;
    let userSession = await getSessionIfStillValid(token);
    if (userSession) {
        return await User.findById(userSession.userId);
    }

    return null;
}

async function authCall(_method, req, res, sessionItemType) {
    const token = req.cookies.token;
    let sessionItem = null;
    if (token){
        sessionItem = await getSessionItemByType(sessionItemType, token);
    }
    if (!sessionItem) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Unauthorized' });
    } else {
        return _method(sessionItem);
    }
}

function getSessionItemByType(sessionItemType, token) {
    switch (sessionItemType) {
        case SESSIONITEMTYPES.USER:
            return getUserSessionIfStillValid(token);
        case SESSIONITEMTYPES.SESSION:
            return getSessionIfStillValid(token);
        default:
            return null;
    }
}

export { SESSIONITEMTYPES, authCall, getSessionIfStillValid, getUserSessionIfStillValid };
export default { SESSIONITEMTYPES, authCall, getSessionIfStillValid, getUserSessionIfStillValid };