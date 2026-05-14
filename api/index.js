const app = require('../server/index');
const { setupDatabase } = require('../server/database');

module.exports = async (req, res) => {
    await setupDatabase();
    return app(req, res);
};
