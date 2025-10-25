import { register } from 'prom-client';

const grafanaRoutes = (app) => {

    app.get('/grafa_metrics', async (_req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (err) {
            res.status(500).end(err);
        }
    });
}
export default grafanaRoutes;