const PaintingProject = require('../model/paintingProject');
const CONST = require('/constants');

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

        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('paintingBoard2/paintingBoard2', {
                title: 'PaintingBoard',
                username: user.username,
                isAdmin: user.admin,
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
        if (req.session.passport && req.session.passport.user) {
            const userId = req.session.passport.user._id;
            const id = req.query.id;
            if (!id  || id.trim() === '') {
                return res.status(400).send('Project id is required');
            }
            if (id) {
                await PaintingProject.deleteOne({ _id: id, userId }).exec();
            }
            res.send({ success: true });
        } else {
            res.status(401).send('Unauthorized');
        }
    });

    /**
     * Get all projects for the logged-in user
     * Response: Array of project objects
     */
    app.get(CONTROLLER + '/projects/all', async (req, res) => {
        if (req.session.passport && req.session.passport.user) {
            const userId = req.session.passport.user._id;
            const projects = await getPaintingProjectsByUserId(userId);
            res.send(projects || []);
        } else {
            res.redirect('/');
        }
    });

    /**
     * Get a project by id
     * Response: Project object
     */
    app.get(CONTROLLER + '/projects/id', async (req, res) => {
        const id = req.query.id;
        if (!id) {
            return res.status(400).send('Project id is required');
        }

        if (req.session.passport && req.session.passport.user) {
            const userId = req.session.passport.user._id;
            const project = await getPaintingProjectByIdAndUser(id, userId);
            if (!project) {
                return res.status(404).send('Project not found');
            }
            res.send(project);

        } else {
            res.status(401).send('Unauthorized');
        }
    });

    /**
     * Save project
     * Request body: { project: { name, layers, canvas, dateCreated } }
     * Query parameters: id (optional)
     * Response: { id: projectId }
     * If id is provided, updates the existing project.
     * If provided id does not exist, 400 Bad Request is returned.
     * If provided id does not belong to the user, returns 403 Forbidden.
     * If no id is provided, creates a new project for the user.
     * 
     */
    app.post(CONTROLLER + '/save', async (req, res) => {

        if (req.session.passport && req.session.passport.user) {
            const userId = req.session.passport.user._id;
            const projectData = req.body.project;
            const id = req.query.id || projectData._id;
            let project;
            if (id) {
                project = await PaintingProject.findById(id).exec();
                if (!project) {
                    return res.status(400).send('Project not found');
                } else if (project.userId.toString() !== userId) {
                    return res.status(403).send('Forbidden');
                }
            } else {
                project = new PaintingProject();
            }
            project.userId = userId;
            project.name = projectData.name;
            project.layers = projectData.layers;
            project.canvas = projectData.canvas;
            project.dateCreated = projectData.dateCreated;
            project.dateModified = Date.now();
            const answer = await project.save();
            res.send({ success: true, id: answer._id });
        } else {
            res.status(401).send('Unauthorized');
        }
    });

    async function addProjectShapes(project, projects) {
        if (!project.layers || project.layers.length === 0) {
            return;
        }

        for (const layer of project.layers) {
            for (const shape of (layer.shapes || [])) {
                if (shape.desc === CONST.PROJECT_SHAPE) {
                    const projectId = shape.projectId;
                    if (projects[projectId]) {
                        shape.layers = projects[projectId].layers;
                    }
                }
            }
        }
        return project;
    }

    async function getPaintingProjectByIdAndUser(id, userId) {
        const userProjects = await getPaintingProjectsByUserId(userId);
        if (!userProjects || userProjects.length === 0) {
            return null;
        }
        return userProjects.find(project => project._id.toString() === id);
    }

    async function getPaintingProjectsByUserId(userId) {
        const projects = await PaintingProject.find({ userId }).exec();
        if (!projects || projects.length === 0) {
            return [];
        }
        const projectsMap = {};
        const projectsList = [];
        projects.forEach(project => {
            projectsMap[project._id] = project.toObject();
            projectsList.push(project.toObject());
        });
        return Promise.all(projectsList.map(project => addProjectShapes(project, projectsMap)));
    }
}