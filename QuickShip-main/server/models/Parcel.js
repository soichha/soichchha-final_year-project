module.exports = (sequelize, DataTypes) => {
    const Parcel = sequelize.define("Parcel", {
        parcel_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        source_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locations',
                key: 'location_id'
            }
        },
        destination_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locations',
                key: 'location_id'
            }
        },
        weight: {
            type: DataTypes.FLOAT,
            defaultValue: 1.0,
        },
        delivery_type: {
            type: DataTypes.ENUM('Air', 'Vehicle'),
            defaultValue: 'Vehicle',
        },
        
        priority: {
            type: DataTypes.ENUM('Standard', 'Express'),
            defaultValue: 'Standard'
        },
        
        predicted_delivery_hours: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        
        prediction_source: {
            type: DataTypes.STRING,
            allowNull: true
        },
        total_cost: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
        },
        parcel_status: {
            type: DataTypes.ENUM(
                'Booked', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery',
                'Delivery Attempt Failed', 'Rescheduled',
                'Delivered', 'Cancelled'
            ),
            defaultValue: 'Booked',
        },
        booking_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        receiver_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        receiver_phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tracking_hash: {
            type: DataTypes.STRING
        }
    }, {
        underscored: true,
        indexes: [{ name: 'tracking_hash', unique: true, fields: ['tracking_hash'] }]
    });

    Parcel.associate = (models) => {
        Parcel.belongsTo(models.User, { foreignKey: 'client_id', as: 'client' });
        Parcel.belongsTo(models.Location, { foreignKey: 'source_location_id', as: 'sourceLocation' });
        Parcel.belongsTo(models.Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });
        Parcel.hasOne(models.Delivery, { foreignKey: 'parcel_id', as: 'delivery' });
        Parcel.hasOne(models.Payment, { foreignKey: 'parcel_id', as: 'payment' });
        Parcel.hasMany(models.TrackingHistory, { foreignKey: 'parcel_id', as: 'trackingHistory' });
        Parcel.hasMany(models.DeliveryAttempt, { foreignKey: 'parcel_id', as: 'deliveryAttempts' });
    };

    return Parcel;
};
