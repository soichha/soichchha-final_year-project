module.exports = (sequelize, DataTypes) => {
    const Location = sequelize.define("Location", {
        location_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        province: {
            type: DataTypes.STRING,
            allowNull: false
        },
        district: {
            type: DataTypes.STRING,
            allowNull: false
        },
        city_or_area: {
            type: DataTypes.STRING,
            allowNull: false
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        full_address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: false,
        underscored: true
    });

    return Location;
};
