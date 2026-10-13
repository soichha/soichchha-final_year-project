module.exports = (sequelize, DataTypes) => {
    const Delivery = sequelize.define("Delivery", {
        delivery_id: {
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
        assigned_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        assigned_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        delivery_status: {
            type: DataTypes.STRING, 
            defaultValue: 'Assigned'
        },
        
        assignment_type: {
            type: DataTypes.ENUM('Manual', 'Auto'),
            defaultValue: 'Manual',
            allowNull: false
        },
        assignment_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        workload_at_assignment: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        delivered_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        received_by: {
            type: DataTypes.STRING,
            allowNull: true
        },
        delivery_remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        
        delivered_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        
        next_delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }
    }, {
        underscored: true,
        indexes: [{ name: 'parcel_id', unique: true, fields: ['parcel_id'] }]
    });

    Delivery.associate = (models) => {
        Delivery.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
        Delivery.belongsTo(models.User, { foreignKey: 'staff_id', as: 'staff' });
        Delivery.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
        Delivery.belongsTo(models.User, { foreignKey: 'delivered_by', as: 'deliveredByUser' });
    };

    return Delivery;
};
