var AdLifecycleService = (function () {
  'use strict';

  var REQUIREMENT_HEADERS = [
    'Ad Requirement ID',
    'Ad Entry ID',
    'Client ID',
    'Client Requirements',
    'Created At',
    'Updated At'
  ];

  var CANCELLATION_HEADERS = [
    'Cancellation ID',
    'Ad Entry ID',
    'Client ID',
    'Reason',
    'Canceled By',
    'Canceled At'
  ];

  function getSpreadsheet() {
    return Config.getSpreadsheet();
  }

  function requirePermission(action) {
    if (typeof Security !== 'undefined' && Security.assertPermission) {
      Security.assertPermission('ADS', action);
    }
  }

  function currentUser() {
    try {
      return Security.getCurrentEmail();
    } catch (error) {
      return '';
    }
  }

  function ensureSheet(name, headers) {
    var sheet = getSpreadsheet().getSheetByName(name);

    if (!sheet) {
      sheet = getSpreadsheet().insertSheet(name);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1d2635')
        .setFontColor('#ffffff');
    }

    return sheet;
  }

  function getRequirementsSheet() {
    return ensureSheet('Ad Requirements', REQUIREMENT_HEADERS);
  }

  function getCancellationsSheet() {
    return ensureSheet('Ad Cancellations', CANCELLATION_HEADERS);
  }

  function getObjects(sheet) {
    if (sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (header) {
      return String(header || '').trim();
    });

    return values.slice(1).map(function (row, index) {
      var item = { _rowNumber: index + 2 };

      headers.forEach(function (header, column) {
        item[header] = row[column];
      });

      return item;
    }).filter(function (item) {
      return Object.keys(item).some(function (key) {
        return key !== '_rowNumber' && item[key] !== '' && item[key] !== null;
      });
    });
  }

  function findById(items, fieldName, id) {
    return items.find(function (item) {
      return String(item[fieldName] || '') === String(id || '');
    }) || null;
  }

  function updateObjectRow(sheet, rowNumber, item) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([
      headers.map(function (header) {
        return typeof item[header] === 'undefined' ? '' : item[header];
      })
    ]);
  }

  function saveRequirements(adEntryId, clientId, requirements) {
    if (!requirements) {
      return null;
    }

    var sheet = getRequirementsSheet();
    var existing = findById(
      getObjects(sheet),
      'Ad Entry ID',
      adEntryId
    );

    var now = new Date().toISOString();
    var record = {
      'Ad Requirement ID': existing
        ? existing['Ad Requirement ID']
        : 'ADRQ-' + Utilities.getUuid(),
      'Ad Entry ID': String(adEntryId),
      'Client ID': String(clientId),
      'Client Requirements': String(requirements).trim(),
      'Created At': existing ? existing['Created At'] : now,
      'Updated At': now
    };

    if (existing) {
      updateObjectRow(sheet, existing._rowNumber, record);
    } else {
      sheet.appendRow(REQUIREMENT_HEADERS.map(function (header) {
        return record[header];
      }));
    }

    return record;
  }

  function saveAdWithDetails(data) {
    requirePermission(data && data.adEntryId ? 'EDIT' : 'CREATE');

    data = data || {};

    var result = adSaveWithClientStatement(data);

    var requirement = saveRequirements(
      result.entry.adEntryId,
      data.clientId,
      data.clientRequirements
    );

    return {
      entry: result.entry,
      clientCharge: result.clientCharge,
      rules: result.rules,
      warning: result.warning,
      clientRequirements: requirement
    };
  }

  function cancelAd(adEntryId, reason) {
    requirePermission('EDIT');

    if (!String(reason || '').trim()) {
      throw new Error('سبب إلغاء الإعلان مطلوب للحفاظ على السجل المالي.');
    }

    var spreadsheet = getSpreadsheet();
    var revenueSheet = spreadsheet.getSheetByName('Ad Revenue');

    if (!revenueSheet) {
      throw new Error('جدول Ad Revenue غير موجود.');
    }

    var entry = findById(
      getObjects(revenueSheet),
      'Ad Entry ID',
      adEntryId
    );

    if (!entry) {
      throw new Error('الإعلان غير موجود.');
    }

    var now = new Date().toISOString();

    /*
     * لا نحذف الإعلان ولا نلمس حركة البنك.
     * نغير الحالة فقط إلى CANCELED مع الاحتفاظ بكل القيم.
     */
    entry['Payment Status'] = 'CANCELED';
    entry['Updated At'] = now;

    updateObjectRow(revenueSheet, entry._rowNumber, entry);

    /*
     * نحتفظ ببند كشف العميل نفسه، لكن حالته تصبح CANCELED.
     * شاشة كشف الحساب ستستبعد CANCELED من الرصيد المستحق،
     * مع بقائه ظاهرًا كسجل تاريخي.
     */
    var chargesSheet = spreadsheet.getSheetByName('Client Ad Charges');

    if (chargesSheet) {
      var charge = findById(
        getObjects(chargesSheet),
        'Ad Entry ID',
        adEntryId
      );

      if (charge) {
        charge['Status'] = 'CANCELED';
        charge['Updated At'] = now;
        updateObjectRow(chargesSheet, charge._rowNumber, charge);
      }
    }

    getCancellationsSheet().appendRow([
      'ADC-' + Utilities.getUuid(),
      String(adEntryId),
      String(entry['Client ID'] || ''),
      String(reason).trim(),
      currentUser(),
      now
    ]);

    return {
      ok: true,
      adEntryId: String(adEntryId),
      status: 'CANCELED',
      bankTransactionPreserved: Boolean(entry['Bank Transaction ID']),
      clientChargePreserved: true
    };
  }

  function getRequirements(adEntryId) {
    requirePermission('VIEW');

    return getObjects(getRequirementsSheet())
      .filter(function (item) {
        return !adEntryId ||
          String(item['Ad Entry ID']) === String(adEntryId);
      })
      .map(function (item) {
        return {
          adEntryId: String(item['Ad Entry ID']),
          clientId: String(item['Client ID']),
          clientRequirements: String(item['Client Requirements']),
          updatedAt: String(item['Updated At'])
        };
      });
  }

  return {
    saveAdWithDetails: saveAdWithDetails,
    cancelAd: cancelAd,
    getRequirements: getRequirements
  };
})();

function adSaveWithDetails(data) {
  return AdLifecycleService.saveAdWithDetails(data || {});
}

function adCancelWithHistory(adEntryId, reason) {
  return AdLifecycleService.cancelAd(adEntryId, reason);
}

function adGetRequirements(adEntryId) {
  return AdLifecycleService.getRequirements(adEntryId || '');
}