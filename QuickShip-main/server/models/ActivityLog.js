
module.exports = (sequelize, DataTypes) => {
    const ActivityLog = sequelize.define("ActivityLog", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true, 
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        user_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        parcel_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'parcels',
                key: 'parcel_id'
            }
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        underscored: true,
        tableName: 'activity_logs',
        updatedAt: false 
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        ActivityLog.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
    };

    return ActivityLog;
};
