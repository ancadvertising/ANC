var BackupService = (function () {
  var FOLDER_PROPERTY = 'ANC_ERP_BACKUP_FOLDER_ID';
  var TRIGGER_HANDLER = 'runDailyBackup';

  function getBackupFolder() {
    var properties = PropertiesService.getScriptProperties();
    var folderId = properties.getProperty(FOLDER_PROPERTY);

    if (folderId) {
      try {
        return DriveApp.getFolderById(folderId);
      } catch (error) {
        properties.deleteProperty(FOLDER_PROPERTY);
      }
    }

    var folder = DriveApp.createFolder(
      Constants.APP.NAME + ' - Backups'
    );

    properties.setProperty(FOLDER_PROPERTY, folder.getId());
    return folder;
  }

  function createBackup() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheet = Config.getSpreadsheet();
      var sourceFile = DriveApp.getFileById(spreadsheet.getId());
      var folder = getBackupFolder();

      var timestamp = Utilities.formatDate(
        new Date(),
        Constants.APP.TIME_ZONE,
        'yyyy-MM-dd_HH-mm-ss'
      );

      var backupName = Constants.APP.NAME + ' Backup ' + timestamp;
      var backupFile = sourceFile.makeCopy(backupName, folder);

      Logger.audit(
        'BACKUP_CREATED',
        'SYSTEM',
        backupFile.getId(),
        {
          backupName: backupFile.getName(),
          backupUrl: backupFile.getUrl(),
          folderUrl: folder.getUrl()
        }
      );

      return {
        backupId: backupFile.getId(),
        backupName: backupFile.getName(),
        backupUrl: backupFile.getUrl(),
        folderUrl: folder.getUrl(),
        createdAt: Utils.nowIso()
      };
    } finally {
      lock.releaseLock();
    }
  }

  function installDailyTrigger() {
    var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
      return trigger.getHandlerFunction() === TRIGGER_HANDLER;
    });

    if (existing.length > 0) {
      return {
        installed: false,
        message: 'Daily backup trigger already exists.'
      };
    }

    ScriptApp.newTrigger(TRIGGER_HANDLER)
      .timeBased()
      .everyDays(1)
      .atHour(2)
      .create();

    Logger.audit(
      'BACKUP_TRIGGER_INSTALLED',
      'SYSTEM',
      'DAILY_BACKUP',
      { hour: 2, timeZone: Constants.APP.TIME_ZONE }
    );

    return {
      installed: true,
      message: 'Daily backup trigger installed successfully.'
    };
  }

  return Object.freeze({
    createBackup: createBackup,
    installDailyTrigger: installDailyTrigger
  });
})();

function createBackupNow() {
  return BackupService.createBackup();
}

function runDailyBackup() {
  return BackupService.createBackup();
}

function installDailyBackup() {
  return BackupService.installDailyTrigger();
}