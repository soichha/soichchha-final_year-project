module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define("Payment", {
        payment_id: {
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
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        payment_method: {
            type: DataTypes.ENUM('eSewa', 'COD'),
            defaultValue: 'eSewa'
        },
        transaction_reference: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payment_status: {
            type: DataTypes.ENUM('Pending', 'Completed', 'Failed'),
            defaultValue: 'Pending',
        },
        payment_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: false,
        underscored: true,
        indexes: [{ name: 'parcel_id', unique: true, fields: ['parcel_id'] }]
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.Parcel, { foreignKey: 'parcel_id', as: 'parcel' });
    };

    return Payment;
};
