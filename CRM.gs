var CRMService = (function () {
  'use strict';

  var CONTACT_HEADERS = [
    'Contact ID',
    'Client ID',
    'Full Name',
    'Job Title',
    'Email',
    'Phone',
    'Is Primary',
    'Notes',
    'Created At',
    'Updated At'
  ];

  var ACTIVITY_HEADERS = [
    'Activity ID',
    'Client ID',
    'Contact ID',
    'Activity Type',
    'Subject',
    'Details',
    'Activity Date',
    'Created By',
    'Created At'
  ];

  function getSheetName(constantName, fallbackName) {
    if (
      typeof Constants !== 'undefined' &&
      Constants.SHEETS &&
      Constants.SHEETS[constantName]
    ) {
      return Constants.SHEETS[constantName];
    }

    return fallbackName;
  }

  function getSpreadsheet() {
    return Config.getSpreadsheet();
  }

  function requirePermission(action) {
    if (typeof Security !== 'undefined' && Security.assertPermission) {
      Security.assertPermission('CRM', action);
    }
  }

  function getCurrentUserEmail() {
    try {
      if (typeof Security !== 'undefined' && Security.getCurrentEmail) {
        return Security.getCurrentEmail();
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function createSheetIfMissing(sheetName, headers) {
    var spreadsheet = getSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
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

  function getContactsSheet() {
    return createSheetIfMissing(
      getSheetName('CONTACTS', 'Contacts'),
      CONTACT_HEADERS
    );
  }

  function getActivitiesSheet() {
    return createSheetIfMissing(
      getSheetName('CLIENT_ACTIVITIES', 'Client Activities'),
      ACTIVITY_HEADERS
    );
  }

  function getClientsSheet() {
    var spreadsheet = getSpreadsheet();
    var sheetName = getSheetName('CLIENTS', 'Clients');
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('جدول Clients غير موجود. شغّل upgradeToSpecificationV1 أولًا.');
    }

    return sheet;
  }

  function getObjects(sheet) {
    if (sheet.getLastRow() < 2) {
      return [];
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (header) {
      return String(header || '').trim();
    });

    return values.slice(1)
      .map(function (row, index) {
        var item = {
          _rowNumber: index + 2
        };

        headers.forEach(function (header, columnIndex) {
          item[header] = row[columnIndex];
        });

        return item;
      })
      .filter(function (item) {
        return Object.keys(item).some(function (key) {
          return key !== '_rowNumber' &&
            item[key] !== '' &&
            item[key] !== null;
        });
      });
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeBoolean(value) {
    return value === true ||
      String(value || '').trim().toUpperCase() === 'TRUE' ||
      String(value || '').trim().toUpperCase() === 'YES';
  }

  function toIsoDate(value) {
    if (!value) {
      return '';
    }

    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
      return value.toISOString();
    }

    var parsed = new Date(value);

    if (isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toISOString();
  }

  function cleanClient(client) {
    return {
      clientId: String(client['Client ID'] || ''),
      clientName: String(client['Client Name'] || ''),
      status: String(client['Status'] || ''),
      primaryContact: String(client['Primary Contact'] || ''),
      email: String(client['Email'] || ''),
      phone: String(client['Phone'] || ''),
      industry: String(client['Industry'] || ''),
      accountManager: String(client['Account Manager'] || ''),
      createdAt: toIsoDate(client['Created At']),
      updatedAt: toIsoDate(client['Updated At'])
    };
  }

  function cleanContact(contact) {
    return {
      contactId: String(contact['Contact ID'] || ''),
      clientId: String(contact['Client ID'] || ''),
      fullName: String(contact['Full Name'] || ''),
      jobTitle: String(contact['Job Title'] || ''),
      email: String(contact['Email'] || ''),
      phone: String(contact['Phone'] || ''),
      isPrimary: normalizeBoolean(contact['Is Primary']),
      notes: String(contact['Notes'] || ''),
      createdAt: toIsoDate(contact['Created At']),
      updatedAt: toIsoDate(contact['Updated At'])
    };
  }

  function cleanActivity(activity) {
    return {
      activityId: String(activity['Activity ID'] || ''),
      clientId: String(activity['Client ID'] || ''),
      contactId: String(activity['Contact ID'] || ''),
      activityType: String(activity['Activity Type'] || ''),
      subject: String(activity['Subject'] || ''),
      details: String(activity['Details'] || ''),
      activityDate: toIsoDate(activity['Activity Date']),
      createdBy: String(activity['Created By'] || ''),
      createdAt: toIsoDate(activity['Created At'])
    };
  }

  function findById(items, fieldName, id) {
    return items.find(function (item) {
      return String(item[fieldName] || '') === String(id || '');
    }) || null;
  }

  function findColumnIndex(headers, columnName) {
    var index = headers.indexOf(columnName);

    if (index === -1) {
      throw new Error('العمود غير موجود: ' + columnName);
    }

    return index + 1;
  }

  function setObjectRow(sheet, rowNumber, object) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = headers.map(function (header) {
      return typeof object[header] === 'undefined' ? '' : object[header];
    });

    sheet.getRange(rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  }

  function ensureClientExists(clientId) {
    var clients = getObjects(getClientsSheet());
    var client = findById(clients, 'Client ID', clientId);

    if (!client) {
      throw new Error('العميل غير موجود: ' + clientId);
    }

    return client;
  }

  function listClients(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var search = normalizeText(filters.search);
    var status = normalizeText(filters.status);
    var clients = getObjects(getClientsSheet()).map(cleanClient);

    return clients.filter(function (client) {
      var matchesStatus = !status || normalizeText(client.status) === status;

      var searchableText = [
        client.clientId,
        client.clientName,
        client.primaryContact,
        client.email,
        client.phone,
        client.industry,
        client.accountManager
      ].join(' ').toLowerCase();

      var matchesSearch = !search || searchableText.indexOf(search) !== -1;

      return matchesStatus && matchesSearch;
    });
  }

  function getClientProfile(clientId) {
    requirePermission('VIEW');

    if (!clientId) {
      throw new Error('Client ID مطلوب.');
    }

    var clients = getObjects(getClientsSheet());
    var client = findById(clients, 'Client ID', clientId);

    if (!client) {
      throw new Error('العميل غير موجود: ' + clientId);
    }

    var contacts = getObjects(getContactsSheet())
      .filter(function (contact) {
        return String(contact['Client ID']) === String(clientId);
      })
      .map(cleanContact);

    var activities = getObjects(getActivitiesSheet())
      .filter(function (activity) {
        return String(activity['Client ID']) === String(clientId);
      })
      .map(cleanActivity)
      .sort(function (a, b) {
        return new Date(b.activityDate || b.createdAt) -
          new Date(a.activityDate || a.createdAt);
      });

    var projects = [];
    var projectsSheetName = getSheetName('PROJECTS', 'Projects');
    var projectsSheet = getSpreadsheet().getSheetByName(projectsSheetName);

    if (projectsSheet) {
      projects = getObjects(projectsSheet)
        .filter(function (project) {
          return String(project['Client ID']) === String(clientId);
        })
        .map(function (project) {
          return {
            projectId: String(project['Project ID'] || ''),
            projectName: String(project['Project Name'] || ''),
            status: String(project['Status'] || ''),
            priority: String(project['Priority'] || ''),
            budget: Number(project['Budget'] || 0),
            startDate: toIsoDate(project['Start Date']),
            dueDate: toIsoDate(project['Due Date'])
          };
        });
    }

    return {
      client: cleanClient(client),
      contacts: contacts,
      activities: activities,
      projects: projects,
      summary: {
        contactsCount: contacts.length,
        activitiesCount: activities.length,
        projectsCount: projects.length
      }
    };
  }

  function saveContact(data) {
    requirePermission(data && data.contactId ? 'EDIT' : 'CREATE');

    data = data || {};

    if (!data.clientId) {
      throw new Error('Client ID مطلوب.');
    }

    if (!String(data.fullName || '').trim()) {
      throw new Error('اسم جهة الاتصال مطلوب.');
    }

    ensureClientExists(data.clientId);

    var sheet = getContactsSheet();
    var contacts = getObjects(sheet);
    var now = new Date().toISOString();
    var contactId = String(data.contactId || '');

    if (contactId) {
      var existing = findById(contacts, 'Contact ID', contactId);

      if (!existing) {
        throw new Error('جهة الاتصال غير موجودة: ' + contactId);
      }

      var updated = {
        'Contact ID': contactId,
        'Client ID': String(data.clientId),
        'Full Name': String(data.fullName).trim(),
        'Job Title': String(data.jobTitle || '').trim(),
        'Email': String(data.email || '').trim(),
        'Phone': String(data.phone || '').trim(),
        'Is Primary': Boolean(data.isPrimary),
        'Notes': String(data.notes || '').trim(),
        'Created At': existing['Created At'] || now,
        'Updated At': now
      };

      setObjectRow(sheet, existing._rowNumber, updated);

      if (updated['Is Primary']) {
        unsetOtherPrimaryContacts(sheet, contactId, updated['Client ID']);
      }

      return cleanContact(updated);
    }

    contactId = 'CNT-' + Utilities.getUuid();

    var created = {
      'Contact ID': contactId,
      'Client ID': String(data.clientId),
      'Full Name': String(data.fullName).trim(),
      'Job Title': String(data.jobTitle || '').trim(),
      'Email': String(data.email || '').trim(),
      'Phone': String(data.phone || '').trim(),
      'Is Primary': Boolean(data.isPrimary),
      'Notes': String(data.notes || '').trim(),
      'Created At': now,
      'Updated At': now
    };

    sheet.appendRow(CONTACT_HEADERS.map(function (header) {
      return created[header];
    }));

    if (created['Is Primary']) {
      unsetOtherPrimaryContacts(sheet, contactId, created['Client ID']);
    }

    return cleanContact(created);
  }

  function unsetOtherPrimaryContacts(sheet, currentContactId, clientId) {
    var contacts = getObjects(sheet);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var primaryColumn = findColumnIndex(headers, 'Is Primary');

    var targetRows = contacts
      .filter(function (contact) {
        return String(contact['Client ID']) === String(clientId) &&
          String(contact['Contact ID']) !== String(currentContactId) &&
          normalizeBoolean(contact['Is Primary']);
      })
      .map(function (contact) {
        return contact._rowNumber;
      });

    targetRows.forEach(function (rowNumber) {
      sheet.getRange(rowNumber, primaryColumn).setValue(false);
    });
  }

  function deleteContact(contactId) {
    requirePermission('DELETE');

    var sheet = getContactsSheet();
    var contact = findById(getObjects(sheet), 'Contact ID', contactId);

    if (!contact) {
      throw new Error('جهة الاتصال غير موجودة: ' + contactId);
    }

    sheet.deleteRow(contact._rowNumber);

    return {
      ok: true,
      deletedContactId: String(contactId)
    };
  }

  function saveActivity(data) {
    requirePermission('CREATE');

    data = data || {};

    if (!data.clientId) {
      throw new Error('Client ID مطلوب.');
    }

    if (!String(data.subject || '').trim()) {
      throw new Error('عنوان التفاعل مطلوب.');
    }

    ensureClientExists(data.clientId);

    var sheet = getActivitiesSheet();
    var now = new Date().toISOString();

    var activity = {
      'Activity ID': 'ACT-' + Utilities.getUuid(),
      'Client ID': String(data.clientId),
      'Contact ID': String(data.contactId || ''),
      'Activity Type': String(data.activityType || 'NOTE').trim().toUpperCase(),
      'Subject': String(data.subject).trim(),
      'Details': String(data.details || '').trim(),
      'Activity Date': data.activityDate
        ? new Date(data.activityDate).toISOString()
        : now,
      'Created By': getCurrentUserEmail(),
      'Created At': now
    };

    sheet.appendRow(ACTIVITY_HEADERS.map(function (header) {
      return activity[header];
    }));

    return cleanActivity(activity);
  }

  function deleteActivity(activityId) {
    requirePermission('DELETE');

    var sheet = getActivitiesSheet();
    var activity = findById(getObjects(sheet), 'Activity ID', activityId);

    if (!activity) {
      throw new Error('سجل التفاعل غير موجود: ' + activityId);
    }

    sheet.deleteRow(activity._rowNumber);

    return {
      ok: true,
      deletedActivityId: String(activityId)
    };
  }

  function getOverview(filters) {
    requirePermission('VIEW');

    var clients = listClients(filters);
    var contacts = getObjects(getContactsSheet()).map(cleanContact);
    var activities = getObjects(getActivitiesSheet())
      .map(cleanActivity)
      .sort(function (a, b) {
        return new Date(b.activityDate || b.createdAt) -
          new Date(a.activityDate || a.createdAt);
      });

    return {
      clients: clients,
      contacts: contacts,
      recentActivities: activities.slice(0, 20),
      summary: {
        clientsCount: clients.length,
        activeClientsCount: clients.filter(function (client) {
          return normalizeText(client.status) === 'active';
        }).length,
        contactsCount: contacts.length,
        activitiesCount: activities.length
      }
    };
  }

  return {
    getOverview: getOverview,
    listClients: listClients,
    getClientProfile: getClientProfile,
    saveContact: saveContact,
    deleteContact: deleteContact,
    saveActivity: saveActivity,
    deleteActivity: deleteActivity
  };
})();


function crmGetOverview(filters) {
  return CRMService.getOverview(filters || {});
}


function crmListClients(filters) {
  return CRMService.listClients(filters || {});
}


function crmGetClientProfile(clientId) {
  return CRMService.getClientProfile(clientId);
}


function crmSaveContact(contactData) {
  return CRMService.saveContact(contactData || {});
}


function crmDeleteContact(contactId) {
  return CRMService.deleteContact(contactId);
}


function crmSaveActivity(activityData) {
  return CRMService.saveActivity(activityData || {});
}


function crmDeleteActivity(activityId) {
  return CRMService.deleteActivity(activityId);
}