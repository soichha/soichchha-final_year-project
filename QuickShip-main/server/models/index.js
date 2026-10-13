const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'courier_project',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Location = require('./Location')(sequelize, Sequelize);
db.User = require('./User')(sequelize, Sequelize);
db.Parcel = require('./Parcel')(sequelize, Sequelize);
db.Delivery = require('./Delivery')(sequelize, Sequelize);
db.Payment = require('./Payment')(sequelize, Sequelize);
db.TrackingHistory = require('./TrackingHistory')(sequelize, Sequelize);
db.Feedback = require('./Feedback')(sequelize, Sequelize);
db.DeliveryAttempt = require('./DeliveryAttempt')(sequelize, Sequelize);
db.ActivityLog = require('./ActivityLog')(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
