var DataStore = (function () {
  function getSheet(sheetName) {
    var sheet = Config.getSpreadsheet().getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }

    return sheet;
  }

  function getHeaders(sheet) {
    if (sheet.getLastRow() < 1) {
      throw new Error('Sheet has no headers: ' + sheet.getName());
    }

    return sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
  }

  function list(sheetName) {
    var sheet = getSheet(sheetName);

    if (sheet.getLastRow() < 2) return [];

    var headers = getHeaders(sheet);
    var rows = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
      .getValues();

    return rows
      .filter(function (row) {
        return row.some(function (cell) {
          return cell !== '' && cell !== null;
        });
      })
      .map(function (row) {
        return Utils.objectFromRow(headers, row);
      });
  }

  function findById(sheetName, idColumn, id) {
    var records = list(sheetName);

    return records.find(function (record) {
      return String(record[idColumn]) === String(id);
    }) || null;
  }

  function create(sheetName, record) {
    var sheet = getSheet(sheetName);
    var headers = getHeaders(sheet);

    var row = headers.map(function (header) {
      return record[header] !== undefined ? record[header] : '';
    });

    sheet.appendRow(row);

    return Utils.objectFromRow(headers, row);
  }

  function updateById(sheetName, idColumn, id, changes) {
    var sheet = getSheet(sheetName);
    var headers = getHeaders(sheet);
    var idIndex = headers.indexOf(idColumn);

    if (idIndex === -1) {
      throw new Error('ID column not found: ' + idColumn);
    }

    var values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), headers.length).getValues();

    for (var index = 0; index < values.length; index += 1) {
      if (String(values[index][idIndex]) === String(id)) {
        headers.forEach(function (header, columnIndex) {
          if (changes[header] !== undefined) {
            values[index][columnIndex] = changes[header];
          }
        });

        sheet.getRange(index + 2, 1, 1, headers.length).setValues([values[index]]);
        return Utils.objectFromRow(headers, values[index]);
      }
    }

    return null;
  }

  return Object.freeze({
    list: list,
    findById: findById,
    create: create,
    updateById: updateById
  });
})();