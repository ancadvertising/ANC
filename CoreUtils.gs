var Utils = (function () {
  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function nowIso() {
    return Utilities.formatDate(
      new Date(),
      Constants.APP.TIME_ZONE,
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
    );
  }

  function newId(prefix) {
    var safePrefix = String(prefix || 'ID')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .toUpperCase();

    return safePrefix + '-' + Utilities.getUuid();
  }

  function safeJsonParse(value, fallback) {
    if (isBlank(value)) return fallback;

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function safeJsonStringify(value) {
    return JSON.stringify(value, function (key, item) {
      if (item instanceof Date) {
        return Utilities.formatDate(
          item,
          Constants.APP.TIME_ZONE,
          "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
        );
      }

      return item;
    });
  }

  function requireFields(object, fields) {
    var missing = fields.filter(function (field) {
      return isBlank(object[field]);
    });

    if (missing.length > 0) {
      throw new Error('Missing required field(s): ' + missing.join(', '));
    }
  }

  function normalizeEnum(value, allowedValues, fieldName) {
    var normalized = String(value || '').trim().toUpperCase();

    if (allowedValues.indexOf(normalized) === -1) {
      throw new Error(
        (fieldName || 'Value') +
        ' must be one of: ' +
        allowedValues.join(', ')
      );
    }

    return normalized;
  }

  function actorEmail() {
    try {
      return Session.getActiveUser().getEmail() || 'system';
    } catch (error) {
      return 'system';
    }
  }

  function objectFromRow(headers, row) {
    return headers.reduce(function (result, header, index) {
      result[header] = row[index];
      return result;
    }, {});
  }

  return Object.freeze({
    isBlank: isBlank,
    nowIso: nowIso,
    newId: newId,
    safeJsonParse: safeJsonParse,
    safeJsonStringify: safeJsonStringify,
    requireFields: requireFields,
    normalizeEnum: normalizeEnum,
    actorEmail: actorEmail,
    objectFromRow: objectFromRow
  });
})();