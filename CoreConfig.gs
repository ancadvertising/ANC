var Config = (function () {
  var properties = PropertiesService.getScriptProperties();

  function propertyKey(name) {
    return Constants.APP.PROPERTY_PREFIX + name;
  }

  function get(name, fallback) {
    var raw = properties.getProperty(propertyKey(name));

    if (raw === null) return fallback;

    return Utils.safeJsonParse(raw, raw);
  }

  function set(name, value) {
    var storedValue = typeof value === 'string'
      ? value
      : Utils.safeJsonStringify(value);

    properties.setProperty(propertyKey(name), storedValue);
    Cache.remove('configuration');

    return value;
  }

  function getSpreadsheet() {
    var spreadsheetId = properties.getProperty(
      propertyKey('SPREADSHEET_ID')
    );

    if (!spreadsheetId) {
      throw new Error(
        'ERP workspace is not initialized. Run setupRelease01() first.'
      );
    }

    return SpreadsheetApp.openById(spreadsheetId);
  }

  function snapshot() {
    return Cache.getOrSet('configuration', function () {
      return {
        appName: Constants.APP.NAME,
        version: Constants.APP.VERSION,
        timeZone: Constants.APP.TIME_ZONE,
        spreadsheetId: properties.getProperty(
          propertyKey('SPREADSHEET_ID')
        ) || null,
        initializedAt: properties.getProperty(
          propertyKey('INITIALIZED_AT')
        ) || null
      };
    }, 300);
  }

  function initialize() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      var spreadsheetId = properties.getProperty(
        propertyKey('SPREADSHEET_ID')
      );

      var spreadsheet = spreadsheetId
        ? SpreadsheetApp.openById(spreadsheetId)
        : SpreadsheetApp.create(
          Constants.APP.NAME + ' - Release 0.1'
        );

      if (!spreadsheetId) {
        properties.setProperties({
          ANC_ERP_SPREADSHEET_ID: spreadsheet.getId(),
          ANC_ERP_INITIALIZED_AT: Utils.nowIso(),
          ANC_ERP_SCHEMA_VERSION: Constants.APP.VERSION
        });
      }

      Template.apply(spreadsheet);
      Cache.clearAll();

      Logger.audit(
        'SYSTEM_INITIALIZED',
        'SYSTEM',
        spreadsheet.getId(),
        {
          version: Constants.APP.VERSION,
          spreadsheetUrl: spreadsheet.getUrl()
        }
      );

      return Response.success({
        spreadsheetId: spreadsheet.getId(),
        spreadsheetUrl: spreadsheet.getUrl(),
        schema: Template.getDefinitions()
      });
    } finally {
      lock.releaseLock();
    }
  }

  return Object.freeze({
    get: get,
    set: set,
    getSpreadsheet: getSpreadsheet,
    snapshot: snapshot,
    initialize: initialize
  });
})();