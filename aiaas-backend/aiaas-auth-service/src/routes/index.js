const authRoutes = require('./auth.route');
const healthRoutes = require('./health.route');

module.exports = {
    auth: authRoutes,
    health: healthRoutes,
}