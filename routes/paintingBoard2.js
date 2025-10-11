const PaintingProject = require('../model/paintingProject');

const CONTROLLER = '/paintingBoard2'
module.exports = (app) => {
    /**
     * Get painting board page
     * Query parameters: id (optional)
     * Response: HTML page
     */
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

    /**
     * Get projects page
     * Response: HTML page
     * Renders a page that lists all projects for the logged-in user.
     * Each project entry includes a thumbnail preview, project name (as a link to open the project), creation date, modification date, and a delete button.
     */
    app.get(CONTROLLER + '/projects', async (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('paintingBoard/projects', {
                title: 'Projects',
                username: user.username,
                isAdmin: user.admin,
            });
        } else {
            res.redirect('/');
        }
    });

    /**
     * Delete project
     * Request parameters: id
     * Response: { success: true }
     */
    app.delete(CONTROLLER + '/projects', async (req, res) => {
        const id = req.query.id;
        if (id) {
            await PaintingProject.deleteOne({ _id: id });
        }
        res.send({ success: true });
    });

    /**
     * Get all projects for the logged-in user
     * Response: Array of project objects
     */
    app.get(CONTROLLER + '/projects/all', async (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            const projects = await PaintingProject.find({ userId: req.session.passport.user._id }) || [];
            res.send(projects);
        } else {
            res.redirect('/');
        }
    });

    /**
     * Save project
     * Request body: { project: { name, layers, canvas, dateCreated } }
     * Query parameters: id (optional)
     * Response: { id: projectId }
     * If id is provided, updates the existing project. Otherwise, creates a new project.
     */
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