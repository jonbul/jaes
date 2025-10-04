const PaintingProject = require('../model/paintingProject');

const CONTROLLER = '/paintingBoard2'
module.exports = (app) => {
    app.get(CONTROLLER, async (req, res) => {
        const id = req.query.id;
        let project;
        if (id) {
            project = await PaintingProject.findById(id).exec();
        }

        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('paintingBoard2/paintingBoard2', {
                title: 'PaintingBoard',
                username: user.username,
                isAdmin: user.admin,
                project
            });
        } else {
            res.redirect('/');
        }
    });
    app.get(CONTROLLER + '/projects', async (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            const projects = await PaintingProject.find({ userId: req.session.passport.user._id }) || [];
            res.render('paintingBoard/projects', {
                title: 'Projects',
                username: user.username,
                isAdmin: user.admin,
                projects
            });
        } else {
            res.redirect('/');
        }
    });
    app.post(CONTROLLER + '/save', async (req, res) => {
        const projectData = req.body.project;
        const id = req.query.id || projectData._id;
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
        project.canvas = projectData.canvas;
        project.dateCreated = projectData.dateCreated;
        project.dateModified = Date.now();
        const answer = await project.save();
        res.send({ id: answer._id });
    });
}