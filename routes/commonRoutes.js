import Session from '../model/session.js';
import User from '../model/user.js';

const SESSIONITEMTYPES = {
    USER: 1,
    SESSION: 2,
    USER_SESSION: 3
};

async function getSessionIfStillValid(token) {
    if (!token) return null;
    let userSession = await Session.findOne({ token, loggedOut: false });
    if (!userSession) return null;
    if (userSession.persistant || userSession.sessionTimestamp + 24 * 60 * 60 * 1000 > Date.now()) return userSession;

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

async function authCall(fun, req, res, sessionItemType) {
    let sessionItem = await getSessionItemByType(sessionItemType, req.cookies.token);
    if (!sessionItem) {
        return res.status(401).json({ error: 'Unauthorized' });
    } else {
        return fun(sessionItem);
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