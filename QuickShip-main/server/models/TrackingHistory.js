module.exports = (sequelize, DataTypes) => {
    const TrackingHistory = sequelize.define("TrackingHistory", {
        tracking_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        parcel_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'parcels',
                key: 'parcel_id'
            }
        },
        current_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'locations',
                key: 'location_id'
            }
        },
        status_message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: false,
        underscored: true,
        tableName: 'tracking_history'
    });

    TrackingHistory.associate = (models) => {
        TrackingHistory.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
        TrackingHistory.belongsTo(models.Location, { foreignKey: 'current_location_id', as: 'currentLocation' });
    };

    return TrackingHistory;
};
