module.exports = function (sequelize, DataTypes) {
    var ArchivalConfig = sequelize.define("ArchivalConfig", {
        Name:{
            type: DataTypes.STRING
        },
        AdditionalFilterCriteria: {
            type: DataTypes.STRING
        },
        ArchiveFieldHistory: {
            type: DataTypes.BOOLEAN
        },
        AttachmentSource: {
            type: DataTypes.STRING
        },
        ChildCountFieldName: {
            type: DataTypes.STRING
        },
        EnableRecreationinSFDC: {
            type: DataTypes.BOOLEAN
        },
        FieldNameToCreateFieldsets: {
            type: DataTypes.STRING
        },
        FieldSetsforDisplay: {
            type: DataTypes.STRING
        },
        HasAttachments: {
            type: DataTypes.BOOLEAN
        },
        HasDetailPage: {
            type: DataTypes.BOOLEAN
        },
        HasNotes: {
            type: DataTypes.BOOLEAN
        },
        IsSearchable: {
            type: DataTypes.BOOLEAN
        },
        ObjectName: {
            type: DataTypes.STRING
        },
        ObjectUniqueIdentifier: {
            type: DataTypes.STRING
        },
        Order: {
            type: DataTypes.INTEGER
        },
        ParentField: {
            type: DataTypes.STRING
        },
        RelatedItemsforDisplay: {
            type: DataTypes.STRING
        },
        RelatedParentObject: {
            type: DataTypes.STRING
        },
        S3RootFolder: {
            type: DataTypes.STRING
        },
    })
    return ArchivalConfig;
};