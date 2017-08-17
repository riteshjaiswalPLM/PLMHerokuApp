module.exports = function (sequelize, DataTypes) {
    var ArchivalSystemConfig = sequelize.define("ArchivalSystemConfig", {
        ArchiveFieldHistoryBatchSize: {
            type: DataTypes.INTEGER
        },
        ArchiveSObjectToS3batchSize: {
            type: DataTypes.INTEGER
        },
        DeleteAlreadyArchivedRecordsBatchSize: {
            type: DataTypes.INTEGER
        },
        EnableParentheticalCurrencyConversion: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
         FieldHistoryFileSize : {
            type: DataTypes.INTEGER
        },
        GenericArchiveNotesBatchSize: {
            type: DataTypes.INTEGER
        },
         GenericArchiveToRDSBatchSize: {
            type: DataTypes.INTEGER
        },
         MarkChildEligibityForDeleteBatchSize : {
            type: DataTypes.INTEGER
        },
        MarkRecordsEligibleForDeleteBatchSize : {
            type: DataTypes.INTEGER
        },
        ParentBatchSizeforAttachments	 : {
            type: DataTypes.INTEGER
        },
        VisibilityExportToCSV : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        ArchivalNamespace : {
           type: DataTypes.STRING,
           allowNull: false,
        },
        ArchiveLargeAttachmentBatchSize : {
            type: DataTypes.INTEGER
        },
        CommaSeparatedListofEmails : {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Downformaintenance : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        EnableServerSideEncryptionS3 : {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        GenericArchiveAttachmentBatchSize : {
            type: DataTypes.INTEGER
        },
        GenericArchiveRelatedItemsBatchSize: {
             type: DataTypes.INTEGER
        },
        ImplementationName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        MarkParentEligibityForDeleteBatchSize: {
             type: DataTypes.INTEGER
        },
        MarkRelatedItemsCountOnParentSize: {
             type: DataTypes.INTEGER
        },
        MarkRelatedItemsCountOnParentSize: { 
             type: DataTypes.INTEGER
        },
        ParentBatchSizeforNotes: { 
             type: DataTypes.INTEGER
        },
    })
    return ArchivalSystemConfig;
};