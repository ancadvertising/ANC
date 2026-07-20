var StudioService = (function () {
  'use strict';

  var JOB_HEADERS = [
    'Studio Job ID',
    'Client ID',
    'Project ID',
    'Job Title',
    'Service Type',
    'Status',
    'Priority',
    'Assigned To',
    'Brief',
    'Due Date',
    'Delivered At',
    'Created By',
    'Created At',
    'Updated At'
  ];

  var ASSET_HEADERS = [
    'Asset ID',
    'Studio Job ID',
    'Asset Name',
    'Asset Type',
    'Drive URL',
    'Version',
    'Status',
    'Uploaded By',
    'Created At',
    'Updated At'
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
      Security.assertPermission('STUDIO', action);
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

  function getJobsSheet() {
    return createSheetIfMissing(
      getSheetName('STUDIO_JOBS', 'Studio Jobs'),
      JOB_HEADERS
    );
  }

  function getAssetsSheet() {
    return createSheetIfMissing(
      getSheetName('STUDIO_ASSETS', 'Studio Assets'),
      ASSET_HEADERS
    );
  }

  function getClientsSheet() {
    var sheet = getSpreadsheet().getSheetByName(
      getSheetName('CLIENTS', 'Clients')
    );

    if (!sheet) {
      throw new Error('جدول Clients غير موجود.');
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
        var item = { _rowNumber: index + 2 };

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

  function toIsoDate(value) {
    if (!value) {
      return '';
    }

    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
      return value.toISOString();
    }

    var parsed = new Date(value);

    return isNaN(parsed.getTime())
      ? String(value)
      : parsed.toISOString();
  }

  function findById(items, fieldName, id) {
    return items.find(function (item) {
      return String(item[fieldName] || '') === String(id || '');
    }) || null;
  }

  function setObjectRow(sheet, rowNumber, object) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([
      headers.map(function (header) {
        return typeof object[header] === 'undefined' ? '' : object[header];
      })
    ]);
  }

  function getClientNames() {
    var names = {};

    getObjects(getClientsSheet()).forEach(function (client) {
      names[String(client['Client ID'] || '')] =
        String(client['Client Name'] || '');
    });

    return names;
  }

  function requireClient(clientId) {
    if (!clientId) {
      throw new Error('Client ID مطلوب.');
    }

    var client = findById(
      getObjects(getClientsSheet()),
      'Client ID',
      clientId
    );

    if (!client) {
      throw new Error('العميل غير موجود: ' + clientId);
    }

    return client;
  }

  function cleanJob(job, clientNames) {
    return {
      studioJobId: String(job['Studio Job ID'] || ''),
      clientId: String(job['Client ID'] || ''),
      clientName: clientNames[String(job['Client ID'] || '')] || '',
      projectId: String(job['Project ID'] || ''),
      jobTitle: String(job['Job Title'] || ''),
      serviceType: String(job['Service Type'] || ''),
      status: String(job['Status'] || ''),
      priority: String(job['Priority'] || ''),
      assignedTo: String(job['Assigned To'] || ''),
      brief: String(job['Brief'] || ''),
      dueDate: toIsoDate(job['Due Date']),
      deliveredAt: toIsoDate(job['Delivered At']),
      createdBy: String(job['Created By'] || ''),
      createdAt: toIsoDate(job['Created At']),
      updatedAt: toIsoDate(job['Updated At'])
    };
  }

  function cleanAsset(asset, jobsById) {
    var job = jobsById[String(asset['Studio Job ID'] || '')] || {};

    return {
      assetId: String(asset['Asset ID'] || ''),
      studioJobId: String(asset['Studio Job ID'] || ''),
      jobTitle: job.jobTitle || '',
      assetName: String(asset['Asset Name'] || ''),
      assetType: String(asset['Asset Type'] || ''),
      driveUrl: String(asset['Drive URL'] || ''),
      version: String(asset['Version'] || ''),
      status: String(asset['Status'] || ''),
      uploadedBy: String(asset['Uploaded By'] || ''),
      createdAt: toIsoDate(asset['Created At']),
      updatedAt: toIsoDate(asset['Updated At'])
    };
  }

  function listJobs(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var search = normalizeText(filters.search);
    var status = normalizeText(filters.status);
    var serviceType = normalizeText(filters.serviceType);
    var assignedTo = normalizeText(filters.assignedTo);
    var clientId = String(filters.clientId || '');
    var clientNames = getClientNames();

    return getObjects(getJobsSheet())
      .map(function (job) {
        return cleanJob(job, clientNames);
      })
      .filter(function (job) {
        var searchable = [
          job.studioJobId,
          job.jobTitle,
          job.clientName,
          job.serviceType,
          job.assignedTo,
          job.brief
        ].join(' ').toLowerCase();

        return (!search || searchable.indexOf(search) !== -1) &&
          (!status || normalizeText(job.status) === status) &&
          (!serviceType || normalizeText(job.serviceType) === serviceType) &&
          (!assignedTo || normalizeText(job.assignedTo) === assignedTo) &&
          (!clientId || job.clientId === clientId);
      })
      .sort(function (a, b) {
        return new Date(a.dueDate || '9999-12-31') -
          new Date(b.dueDate || '9999-12-31');
      });
  }

  function listAssets(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var studioJobId = String(filters.studioJobId || '');
    var search = normalizeText(filters.search);
    var jobs = listJobs({});
    var jobsById = {};

    jobs.forEach(function (job) {
      jobsById[job.studioJobId] = job;
    });

    return getObjects(getAssetsSheet())
      .map(function (asset) {
        return cleanAsset(asset, jobsById);
      })
      .filter(function (asset) {
        var searchable = [
          asset.assetName,
          asset.assetType,
          asset.jobTitle,
          asset.status,
          asset.version
        ].join(' ').toLowerCase();

        return (!studioJobId || asset.studioJobId === studioJobId) &&
          (!search || searchable.indexOf(search) !== -1);
      })
      .sort(function (a, b) {
        return new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt);
      });
  }

  function saveJob(data) {
    data = data || {};
    requirePermission(data.studioJobId ? 'EDIT' : 'CREATE');

    if (!String(data.jobTitle || '').trim()) {
      throw new Error('عنوان طلب الاستوديو مطلوب.');
    }

    if (!String(data.serviceType || '').trim()) {
      throw new Error('نوع الخدمة مطلوب.');
    }

    requireClient(data.clientId);

    var sheet = getJobsSheet();
    var jobs = getObjects(sheet);
    var now = new Date().toISOString();
    var jobId = String(data.studioJobId || '');

    var job = {
      'Studio Job ID': jobId || 'STJ-' + Utilities.getUuid(),
      'Client ID': String(data.clientId),
      'Project ID': String(data.projectId || ''),
      'Job Title': String(data.jobTitle).trim(),
      'Service Type': String(data.serviceType).trim().toUpperCase(),
      'Status': String(data.status || 'NEW').trim().toUpperCase(),
      'Priority': String(data.priority || 'MEDIUM').trim().toUpperCase(),
      'Assigned To': String(data.assignedTo || '').trim(),
      'Brief': String(data.brief || '').trim(),
      'Due Date': data.dueDate ? new Date(data.dueDate).toISOString() : '',
      'Delivered At': String(data.status || '').toUpperCase() === 'DELIVERED'
        ? now
        : '',
      'Created By': getCurrentUserEmail(),
      'Created At': now,
      'Updated At': now
    };

    if (jobId) {
      var existing = findById(jobs, 'Studio Job ID', jobId);

      if (!existing) {
        throw new Error('طلب الاستوديو غير موجود: ' + jobId);
      }

      job['Created By'] = existing['Created By'] || job['Created By'];
      job['Created At'] = existing['Created At'] || now;
      job['Delivered At'] = String(data.status || '').toUpperCase() === 'DELIVERED'
        ? (existing['Delivered At'] || now)
        : '';

      setObjectRow(sheet, existing._rowNumber, job);
    } else {
      sheet.appendRow(JOB_HEADERS.map(function (header) {
        return job[header];
      }));
    }

    return cleanJob(job, getClientNames());
  }

  function saveAsset(data) {
    data = data || {};
    requirePermission(data.assetId ? 'EDIT' : 'CREATE');

    if (!data.studioJobId) {
      throw new Error('Studio Job ID مطلوب.');
    }

    if (!String(data.assetName || '').trim()) {
      throw new Error('اسم الأصل أو الملف مطلوب.');
    }

    if (!String(data.driveUrl || '').trim()) {
      throw new Error('رابط Google Drive مطلوب.');
    }

    var jobs = getObjects(getJobsSheet());
    var job = findById(jobs, 'Studio Job ID', data.studioJobId);

    if (!job) {
      throw new Error('طلب الاستوديو غير موجود: ' + data.studioJobId);
    }

    var sheet = getAssetsSheet();
    var assets = getObjects(sheet);
    var now = new Date().toISOString();
    var assetId = String(data.assetId || '');

    var asset = {
      'Asset ID': assetId || 'AST-' + Utilities.getUuid(),
      'Studio Job ID': String(data.studioJobId),
      'Asset Name': String(data.assetName).trim(),
      'Asset Type': String(data.assetType || 'OTHER').trim().toUpperCase(),
      'Drive URL': String(data.driveUrl).trim(),
      'Version': String(data.version || 'v1').trim(),
      'Status': String(data.status || 'DRAFT').trim().toUpperCase(),
      'Uploaded By': getCurrentUserEmail(),
      'Created At': now,
      'Updated At': now
    };

    if (assetId) {
      var existing = findById(assets, 'Asset ID', assetId);

      if (!existing) {
        throw new Error('الأصل غير موجود: ' + assetId);
      }

      asset['Uploaded By'] = existing['Uploaded By'] || asset['Uploaded By'];
      asset['Created At'] = existing['Created At'] || now;
      setObjectRow(sheet, existing._rowNumber, asset);
    } else {
      sheet.appendRow(ASSET_HEADERS.map(function (header) {
        return asset[header];
      }));
    }

    var clientNames = getClientNames();
    var normalizedJob = cleanJob(job, clientNames);
    var jobsById = {};
    jobsById[normalizedJob.studioJobId] = normalizedJob;

    return cleanAsset(asset, jobsById);
  }

  function deleteJob(studioJobId) {
    requirePermission('DELETE');

    var jobsSheet = getJobsSheet();
    var job = findById(getObjects(jobsSheet), 'Studio Job ID', studioJobId);

    if (!job) {
      throw new Error('طلب الاستوديو غير موجود: ' + studioJobId);
    }

    var linkedAssets = getObjects(getAssetsSheet()).filter(function (asset) {
      return String(asset['Studio Job ID']) === String(studioJobId);
    });

    if (linkedAssets.length) {
      throw new Error(
        'لا يمكن حذف الطلب لأنه يحتوي على ' +
        linkedAssets.length +
        ' أصل أو ملف. غيّر حالته إلى ARCHIVED بدلًا من حذفه.'
      );
    }

    jobsSheet.deleteRow(job._rowNumber);

    return {
      ok: true,
      deletedStudioJobId: String(studioJobId)
    };
  }

  function deleteAsset(assetId) {
    requirePermission('DELETE');

    var sheet = getAssetsSheet();
    var asset = findById(getObjects(sheet), 'Asset ID', assetId);

    if (!asset) {
      throw new Error('الأصل غير موجود: ' + assetId);
    }

    sheet.deleteRow(asset._rowNumber);

    return {
      ok: true,
      deletedAssetId: String(assetId)
    };
  }

  function getOverview(filters) {
    requirePermission('VIEW');

    var jobs = listJobs(filters || {});
    var assets = listAssets({});
    var activeStatuses = ['NEW', 'IN_PROGRESS', 'IN_REVIEW'];
    var activeJobs = jobs.filter(function (job) {
      return activeStatuses.indexOf(String(job.status).toUpperCase()) !== -1;
    });

    var deliveredJobs = jobs.filter(function (job) {
      return String(job.status).toUpperCase() === 'DELIVERED';
    });

    var jobsByStatus = {};

    jobs.forEach(function (job) {
      var status = job.status || 'NEW';

      if (!jobsByStatus[status]) {
        jobsByStatus[status] = 0;
      }

      jobsByStatus[status] += 1;
    });

    return {
      jobs: jobs,
      assets: assets.slice(0, 50),
      statusDistribution: Object.keys(jobsByStatus).map(function (status) {
        return {
          status: status,
          count: jobsByStatus[status]
        };
      }),
      summary: {
        jobsCount: jobs.length,
        activeJobsCount: activeJobs.length,
        deliveredJobsCount: deliveredJobs.length,
        assetsCount: assets.length
      }
    };
  }

  return {
    getOverview: getOverview,
    listJobs: listJobs,
    listAssets: listAssets,
    saveJob: saveJob,
    saveAsset: saveAsset,
    deleteJob: deleteJob,
    deleteAsset: deleteAsset
  };
})();


function studioGetOverview(filters) {
  return StudioService.getOverview(filters || {});
}


function studioListJobs(filters) {
  return StudioService.listJobs(filters || {});
}


function studioListAssets(filters) {
  return StudioService.listAssets(filters || {});
}


function studioSaveJob(jobData) {
  return StudioService.saveJob(jobData || {});
}


function studioSaveAsset(assetData) {
  return StudioService.saveAsset(assetData || {});
}


function studioDeleteJob(studioJobId) {
  return StudioService.deleteJob(studioJobId);
}


function studioDeleteAsset(assetId) {
  return StudioService.deleteAsset(assetId);
}