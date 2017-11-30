module.exports = function (sequelize, DataTypes) {
    var TabConfig = sequelize.define("TabConfig", {
        reportTab: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        },
        archivalTab: {
            type: DataTypes.BOOLEAN,
            defaultValue: function () {
                return false;
            }
        }
    });
    return TabConfig;
};