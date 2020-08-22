const PaintingProject = require('../model/paintingProject');

module.exports = (app) => {
    app.get('/game', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('canvas/game', {
                title: 'Game',
                username: user.username
            });
        } else {
            res.redirect('/');
        }
    });
    app.get('/paintingBoard', async (req, res) => {
        const id = req.query.id;
        let project;
        if (id) {
            project = await PaintingProject.findById(id).exec();
        }

        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('paintingBoard/paintingBoard', {
                title: 'Game',
                username: user.username
            });
        } else {
            res.redirect('/');
        }
    });
    /*app.get('/paintingBoard', async (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            let project;
            project = await PaintingProject.findById(id).exec();
            res.render('paintingBoard/paintingBoard', {
                title: 'Game',
                username: user.username,
                project
            });
        } else {
            res.redirect('/');
        }
    });*/
    app.post('/paintingBoard/save', async (req, res) => {
        const projectData = req.body.project;
        const id = projectData._id;
        let project;
        if (id) {
            project = await PaintingProject.findById(id).exec();
        }
        if (!project) {
            project = new PaintingProject();
        }
        project.userId = req.session.passport.user._id;
        project.name = projectData.name;
        project.layers = projectData.layers;
        
        const answer = await project.save();
        res.send({id: answer._id});
    });
}