module.exports = function (sequelize, DataTypes) {
    var MobileOrgDetail = sequelize.define("MobileOrgDetail", {
        logo: {
            type: DataTypes.TEXT,
        },
        name: {
            type: DataTypes.STRING,
        },
        sysAdminId: {
            type: DataTypes.STRING,
        },
    }, {
        classMethods: {
        }
    });

    return MobileOrgDetail;
};