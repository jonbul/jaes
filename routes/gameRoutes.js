import Ship from '../model/ship.js';
import PaintingProject from '../model/paintingProject.js';
import { resolutions, allowedPlayerTypes } from './constants.js';
import { authCall, SESSIONITEMTYPES, getUserSessionIfStillValid } from './commonRoutes.js';

import WebSocketHandler from './webSocketHandler.js';

let _jaesGameHandlerRegistered = false;

const gameRoutes = (app, mongoose, https) => {
    if (_jaesGameHandlerRegistered) return;
    _jaesGameHandlerRegistered = true;
    const players = {};
    const backgroundCards = {};

    let currentResolution = 2;
    let allowedPlayerType = allowedPlayerTypes.All;

    // Render
    app.get('/game', async (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (allowedPlayerType === allowedPlayerTypes.All || user) {
            const sUser = user;

            res.render('canvas/game', {
                title: 'Game',
                username: sUser ? sUser.username : '',
                isAdmin: sUser ? sUser.admin : false
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/game/status', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (!user?.admin) {
            res.redirect('/');
        } else {
            currentResolution = currentResolution || 1;
            res.render('canvas/gameStatus', {
                title: 'Game Preview',
                username: user.username,
                isAdmin: user.admin,
                canvasWidth: resolutions[currentResolution].width,
                canvasHeight: resolutions[currentResolution].height
            });
        }
    });

    app.get('/game/admin', async (req, res) => {
        currentResolution = Number.isNaN(currentResolution) ? 1 : currentResolution;
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (user?.admin) {

            res.render('canvas/admin', {
                title: 'Administration',
                username: user.username,
                isAdmin: user.admin,
                resolutions,
                currentResolution,
                allowedPlayerTypes,
                allowedPlayerType
            });
        } else {
            res.redirect('/');
        }
    });

    // API
    app.get('/game/data', async (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;

        const user = (await getUserSessionIfStillValid(req.cookies.token)) || {};

        res.send({
            title: 'Game',
            username: user.username || '',
            credits: user.credits || 0,
            canvasWidth: resolutions[currentResolution].width,
            canvasHeight: resolutions[currentResolution].height,
            guestsAllowed: allowedPlayerType === allowedPlayerTypes.All
        });
    });

    app.get('/game/userShips', async (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;
        const sUser = await getUserSessionIfStillValid(req.cookies.token);
        if (allowedPlayerType === allowedPlayerTypes.All || sUser) {
            if (sUser) {
                res.send({
                    userShips: await PaintingProject.find({ userId: sUser._id })
                });
            } else {
                res.send({
                    userShips: []
                })
            }
        } else {
            res.redirect('/');
        }
    });
    app.post('/gameData', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (!user?.admin) return res.redirect('/');
        const resultCards = {};
        for (const propX in backgroundCards) {
            for (const propY in backgroundCards[propX]) {
                if (!req.body[propX] || !req.body[propX][propY]) {
                    resultCards[propX] = resultCards[propX] || {};
                    resultCards[propX][propY] = [
                        backgroundCards[propX][propY][0],
                        backgroundCards[propX][propY][1]
                    ];
                }
            }
        }
        res.send({
            players,
            resultCards
        });
    });
    app.post('/playerTypes', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (!user?.admin) return res.redirect('/');
        const resultCards = {};
        for (const propX in backgroundCards) {
            for (const propY in backgroundCards[propX]) {
                if (!req.body[propX] || !req.body[propX][propY]) {
                    resultCards[propX] = resultCards[propX] || {};
                    resultCards[propX][propY] = backgroundCards[propX][propY];
                }
            }
        }
        res.send({
            players,
            resultCards
        });
    });
    app.get('/game/getShips', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (allowedPlayerType === allowedPlayerTypes.All || user) {
            const s1 = await Ship.find();
            const s2 = await PaintingProject.find();
            res.send(s2.concat(s1));
        }
    });

    app.get('/game/getPlayers', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (allowedPlayerType === allowedPlayerTypes.All || user) {
            res.send(players);
        }
    });

    app.post('/game/admin', async (req, res) => {
        return authCall(async (user) => {
            if (!user?.admin) return res.status(403).send('Forbidden');
            currentResolution = parseInt(req.body.resolution);
            allowedPlayerType = parseInt(req.body.allowedPlayerType);
        }, req, res, SESSIONITEMTYPES.USER);
    });

    app.get('/game/admin/data', async (req, res) => {
        return authCall(async (user) => {
            currentResolution = Number.isNaN(currentResolution) ? 1 : currentResolution;
            if (user?.admin) {

                res.json({
                    resolutions,
                    currentResolution,
                    allowedPlayerTypes,
                    allowedPlayerType
                });
            } else {
                res.redirect('/');
            }
        }, req, res, SESSIONITEMTYPES.USER);
    });

    new WebSocketHandler(https, players, backgroundCards, () => resolutions[currentResolution]);

    console.log('WebSocket Server is running');
}

export default gameRoutes;