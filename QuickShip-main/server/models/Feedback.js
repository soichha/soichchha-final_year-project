module.exports = (sequelize, DataTypes) => {
    const Feedback = sequelize.define('Feedback', {
        feedback_id: {
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
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        staff_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        underscored: true,
        tableName: 'feedbacks',
        indexes: [{ name: 'parcel_id', unique: true, fields: ['parcel_id'] }]
    });

    Feedback.associate = (models) => {
        Feedback.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
        Feedback.belongsTo(models.User, { foreignKey: 'customer_id', as: 'customer' });
        Feedback.belongsTo(models.User, { foreignKey: 'staff_id', as: 'staff' });
    };

    return Feedback;
};
