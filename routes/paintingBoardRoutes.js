import PaintingProject from '../model/paintingProject.js';
import CONST from '../shared/constants.js';
import Session from '../model/session.js';
import User from '../model/user.js';

const CONTROLLER = '/paintingBoard'
const paintingBoardRoutes = (app) => {
    /**
     * Get painting board page
     * Query parameters: id (optional)
     * Response: HTML page
     */
    app.get(CONTROLLER, async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (user) {
            res.render('paintingBoard/paintingBoard', {
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
        const user = await getUserSessionIfStillValid(req.cookies.token);
        if (user) {
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
        const userSession = await getSessionIfStillValid(req.cookies.token);
        if (userSession) {
            const id = req.query.id;
            if (!id  || id.trim() === '') {
                return res.status(400).send('Project id is required');
            }
            if (id) {
                await PaintingProject.deleteOne({ _id: id, userId: userSession.userId }).exec();
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
        const userSession = await getSessionIfStillValid(req.cookies.token);
        if (userSession) {
            const projects = await getPaintingProjectsByUserId(userSession.userId);
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

        const userSession = await getSessionIfStillValid(req.cookies.token);
        if (userSession) {
            const project = await getPaintingProjectByIdAndUser(id, userSession.userId);
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

        const userSession = await getSessionIfStillValid(req.cookies.token);
        if (userSession) {
            const userId = userSession.userId;
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
                if (shape.desc === CONST.PROJECT_SHAPE && shape.projectId != project._id) {
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

async function getSessionIfStillValid(token) {
    let userSession = await Session.findOne({ token, loggedOut: false });
    if (!userSession) return null;
    if (userSession.persistant || userSession.sessionTimestamp + 24 * 60 * 60 * 1000 > Date.now()) return userSession;

    return null;
}

async function getUserSessionIfStillValid(token) {
    let userSession = await getSessionIfStillValid(token);
    if (userSession) {
        return await User.findById(userSession.userId);
    }

    return null;
}

export default paintingBoardRoutes;