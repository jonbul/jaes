const PaintingProject = require('../model/paintingProject');

module.exports = (app) => {
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
                title: 'PaintingBoard',
                username: user.username,
                project
            });
        } else {
            res.redirect('/');
        }
    });
    app.get('/paintingBoard/projects', async (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            const projects = await PaintingProject.find({userId: req.session.passport.user._id}) || [];
            res.render('paintingBoard/projects', {
                title: 'Projects',
                username: user.username,
                projects
            });
        } else {
            res.redirect('/');
        }
    });
    app.post('/paintingBoard/save', async (req, res) => {
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
        res.send({id: answer._id});
        console.log(projectData)
    });
}