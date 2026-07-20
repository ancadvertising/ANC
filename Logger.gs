var Logger = (function () {
  function write(level, message, context) {
    var entry = {
      level: String(level || 'INFO'),
      message: String(message || ''),
      context: context || {},
      timestamp: new Date().toISOString(),
      actor: getActor_()
    };
    console.log(JSON.stringify(entry));
    return entry;
  }

  function getActor_() {
    try {
      return GoogleIdentity.currentEmail();
    } catch (error) {
      return '';
    }
  }

  function audit(action, entityType, entityId, details) {
    var entry = write('AUDIT', action, {
      entityType: entityType || '',
      entityId: entityId || '',
      details: details || {}
    });
    try {
      var spreadsheet = Config.getSpreadsheet();
      var sheet = spreadsheet.getSheetByName('Audit Log');
      if (!sheet) {
        sheet = spreadsheet.insertSheet('Audit Log');
        sheet.appendRow(['Log ID', 'Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Details']);
        sheet.setFrozenRows(1);
      }
      sheet.appendRow(['AUD-' + Utilities.getUuid(), entry.timestamp, entry.actor, action || '', entityType || '', entityId || '', JSON.stringify(details || {})]);
    } catch (error) {
      console.warn('Audit persistence failed: ' + error.message);
    }
    return entry;
  }

  return Object.freeze({
    info: function(message, context) { return write('INFO', message, context); },
    warn: function(message, context) { return write('WARN', message, context); },
    error: function(message, context) { return write('ERROR', message, context); },
    audit: audit
  });
})();
