
module.exports = (sequelize, DataTypes) => {
    const DeliveryAttempt = sequelize.define("DeliveryAttempt", {
        id: {
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
        staff_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        reason: {
            type: DataTypes.ENUM(
                'Receiver unavailable',
                'Wrong address',
                'Phone unreachable',
                'Customer requested reschedule',
                'Other'
            ),
            allowNull: false
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        attempted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        next_delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }
    }, {
        underscored: true,
        tableName: 'delivery_attempts'
    });

    DeliveryAttempt.associate = (models) => {
        DeliveryAttempt.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
        DeliveryAttempt.belongsTo(models.User, { foreignKey: 'staff_id', as: 'staff' });
    };

    return DeliveryAttempt;
};
