var PaidAdsService = (function () {
  'use strict';

  var CAMPAIGN_HEADERS = [
    'Campaign ID',
    'Client ID',
    'Project ID',
    'Campaign Name',
    'Platform',
    'Objective',
    'Status',
    'Start Date',
    'End Date',
    'Budget',
    'Currency',
    'Account Manager',
    'Created At',
    'Updated At'
  ];

  var PAID_AD_HEADERS = [
    'Ad Payment ID',
    'Campaign ID',
    'Client ID',
    'Platform',
    'Payment Method',
    'Amount',
    'Currency',
    'Payment Date',
    'Receipt URL',
    'Notes',
    'Created By',
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
      Security.assertPermission('ADS', action);
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

  function getCampaignsSheet() {
    return createSheetIfMissing(
      getSheetName('CAMPAIGNS', 'Campaigns'),
      CAMPAIGN_HEADERS
    );
  }

  function getPaidAdsSheet() {
    return createSheetIfMissing(
      getSheetName('PAID_ADS', 'Paid Ads'),
      PAID_AD_HEADERS
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

  function toNumber(value) {
    var number = Number(value);

    return isNaN(number) ? 0 : number;
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

  function requireClient(clientId) {
    if (!clientId) {
      throw new Error('Client ID مطلوب.');
    }

    var clients = getObjects(getClientsSheet());
    var client = findById(clients, 'Client ID', clientId);

    if (!client) {
      throw new Error('العميل غير موجود: ' + clientId);
    }

    return client;
  }

  function cleanCampaign(campaign, clientNames) {
    return {
      campaignId: String(campaign['Campaign ID'] || ''),
      clientId: String(campaign['Client ID'] || ''),
      clientName: clientNames[String(campaign['Client ID'] || '')] || '',
      projectId: String(campaign['Project ID'] || ''),
      campaignName: String(campaign['Campaign Name'] || ''),
      platform: String(campaign['Platform'] || ''),
      objective: String(campaign['Objective'] || ''),
      status: String(campaign['Status'] || ''),
      startDate: toIsoDate(campaign['Start Date']),
      endDate: toIsoDate(campaign['End Date']),
      budget: toNumber(campaign['Budget']),
      currency: String(campaign['Currency'] || 'EGP'),
      accountManager: String(campaign['Account Manager'] || ''),
      createdAt: toIsoDate(campaign['Created At']),
      updatedAt: toIsoDate(campaign['Updated At'])
    };
  }

  function cleanAdPayment(payment, campaignsById, clientNames) {
    var campaign = campaignsById[String(payment['Campaign ID'] || '')] || {};

    return {
      adPaymentId: String(payment['Ad Payment ID'] || ''),
      campaignId: String(payment['Campaign ID'] || ''),
      campaignName: campaign.campaignName || '',
      clientId: String(payment['Client ID'] || ''),
      clientName: clientNames[String(payment['Client ID'] || '')] || '',
      platform: String(payment['Platform'] || ''),
      paymentMethod: String(payment['Payment Method'] || ''),
      amount: toNumber(payment['Amount']),
      currency: String(payment['Currency'] || 'EGP'),
      paymentDate: toIsoDate(payment['Payment Date']),
      receiptUrl: String(payment['Receipt URL'] || ''),
      notes: String(payment['Notes'] || ''),
      createdBy: String(payment['Created By'] || ''),
      createdAt: toIsoDate(payment['Created At']),
      updatedAt: toIsoDate(payment['Updated At'])
    };
  }

  function getClientNames() {
    var clients = getObjects(getClientsSheet());
    var names = {};

    clients.forEach(function (client) {
      names[String(client['Client ID'] || '')] =
        String(client['Client Name'] || '');
    });

    return names;
  }

  function listCampaigns(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var search = normalizeText(filters.search);
    var status = normalizeText(filters.status);
    var platform = normalizeText(filters.platform);
    var clientId = String(filters.clientId || '');
    var clientNames = getClientNames();

    return getObjects(getCampaignsSheet())
      .map(function (campaign) {
        return cleanCampaign(campaign, clientNames);
      })
      .filter(function (campaign) {
        var searchable = [
          campaign.campaignId,
          campaign.campaignName,
          campaign.clientName,
          campaign.platform,
          campaign.objective,
          campaign.accountManager
        ].join(' ').toLowerCase();

        return (!search || searchable.indexOf(search) !== -1) &&
          (!status || normalizeText(campaign.status) === status) &&
          (!platform || normalizeText(campaign.platform) === platform) &&
          (!clientId || campaign.clientId === clientId);
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function listAdPayments(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var search = normalizeText(filters.search);
    var campaignId = String(filters.campaignId || '');
    var clientId = String(filters.clientId || '');
    var platform = normalizeText(filters.platform);
    var clientNames = getClientNames();
    var campaigns = listCampaigns({});
    var campaignsById = {};

    campaigns.forEach(function (campaign) {
      campaignsById[campaign.campaignId] = campaign;
    });

    return getObjects(getPaidAdsSheet())
      .map(function (payment) {
        return cleanAdPayment(payment, campaignsById, clientNames);
      })
      .filter(function (payment) {
        var searchable = [
          payment.adPaymentId,
          payment.campaignName,
          payment.clientName,
          payment.platform,
          payment.paymentMethod,
          payment.notes
        ].join(' ').toLowerCase();

        return (!search || searchable.indexOf(search) !== -1) &&
          (!campaignId || payment.campaignId === campaignId) &&
          (!clientId || payment.clientId === clientId) &&
          (!platform || normalizeText(payment.platform) === platform);
      })
      .sort(function (a, b) {
        return new Date(b.paymentDate || b.createdAt) -
          new Date(a.paymentDate || a.createdAt);
      });
  }

  function saveCampaign(data) {
    data = data || {};
    requirePermission(data.campaignId ? 'EDIT' : 'CREATE');

    if (!String(data.campaignName || '').trim()) {
      throw new Error('اسم الحملة مطلوب.');
    }

    if (!String(data.platform || '').trim()) {
      throw new Error('المنصة الإعلانية مطلوبة.');
    }

    requireClient(data.clientId);

    var sheet = getCampaignsSheet();
    var campaigns = getObjects(sheet);
    var now = new Date().toISOString();
    var campaignId = String(data.campaignId || '');

    var campaign = {
      'Campaign ID': campaignId || 'CMP-' + Utilities.getUuid(),
      'Client ID': String(data.clientId),
      'Project ID': String(data.projectId || ''),
      'Campaign Name': String(data.campaignName).trim(),
      'Platform': String(data.platform).trim().toUpperCase(),
      'Objective': String(data.objective || '').trim(),
      'Status': String(data.status || 'DRAFT').trim().toUpperCase(),
      'Start Date': data.startDate ? new Date(data.startDate).toISOString() : '',
      'End Date': data.endDate ? new Date(data.endDate).toISOString() : '',
      'Budget': toNumber(data.budget),
      'Currency': String(data.currency || 'EGP').trim().toUpperCase(),
      'Account Manager': String(data.accountManager || '').trim(),
      'Created At': now,
      'Updated At': now
    };

    if (campaignId) {
      var existing = findById(campaigns, 'Campaign ID', campaignId);

      if (!existing) {
        throw new Error('الحملة غير موجودة: ' + campaignId);
      }

      campaign['Created At'] = existing['Created At'] || now;
      setObjectRow(sheet, existing._rowNumber, campaign);
    } else {
      sheet.appendRow(CAMPAIGN_HEADERS.map(function (header) {
        return campaign[header];
      }));
    }

    return cleanCampaign(campaign, getClientNames());
  }

  function saveAdPayment(data) {
    data = data || {};
    requirePermission(data.adPaymentId ? 'EDIT' : 'CREATE');

    if (!data.campaignId) {
      throw new Error('Campaign ID مطلوب.');
    }

    if (toNumber(data.amount) <= 0) {
      throw new Error('قيمة المدفوعات يجب أن تكون أكبر من صفر.');
    }

    var campaigns = getObjects(getCampaignsSheet());
    var linkedCampaign = findById(campaigns, 'Campaign ID', data.campaignId);

    if (!linkedCampaign) {
      throw new Error('الحملة غير موجودة: ' + data.campaignId);
    }

    var sheet = getPaidAdsSheet();
    var payments = getObjects(sheet);
    var now = new Date().toISOString();
    var paymentId = String(data.adPaymentId || '');

    var payment = {
      'Ad Payment ID': paymentId || 'ADP-' + Utilities.getUuid(),
      'Campaign ID': String(data.campaignId),
      'Client ID': String(linkedCampaign['Client ID']),
      'Platform': String(data.platform || linkedCampaign['Platform'] || '')
        .trim()
        .toUpperCase(),
      'Payment Method': String(data.paymentMethod || 'CASH')
        .trim()
        .toUpperCase(),
      'Amount': toNumber(data.amount),
      'Currency': String(data.currency || linkedCampaign['Currency'] || 'EGP')
        .trim()
        .toUpperCase(),
      'Payment Date': data.paymentDate
        ? new Date(data.paymentDate).toISOString()
        : now,
      'Receipt URL': String(data.receiptUrl || '').trim(),
      'Notes': String(data.notes || '').trim(),
      'Created By': getCurrentUserEmail(),
      'Created At': now,
      'Updated At': now
    };

    if (paymentId) {
      var existing = findById(payments, 'Ad Payment ID', paymentId);

      if (!existing) {
        throw new Error('سجل الدفع غير موجود: ' + paymentId);
      }

      payment['Created At'] = existing['Created At'] || now;
      payment['Created By'] = existing['Created By'] || payment['Created By'];
      setObjectRow(sheet, existing._rowNumber, payment);
    } else {
      sheet.appendRow(PAID_AD_HEADERS.map(function (header) {
        return payment[header];
      }));
    }

    var clientNames = getClientNames();
    var normalizedCampaign = cleanCampaign(linkedCampaign, clientNames);
    var campaignsById = {};
    campaignsById[normalizedCampaign.campaignId] = normalizedCampaign;

    return cleanAdPayment(payment, campaignsById, clientNames);
  }

  function deleteCampaign(campaignId) {
    requirePermission('DELETE');

    var sheet = getCampaignsSheet();
    var campaign = findById(getObjects(sheet), 'Campaign ID', campaignId);

    if (!campaign) {
      throw new Error('الحملة غير موجودة: ' + campaignId);
    }

    var linkedPayments = getObjects(getPaidAdsSheet()).filter(function (payment) {
      return String(payment['Campaign ID']) === String(campaignId);
    });

    if (linkedPayments.length) {
      throw new Error(
        'لا يمكن حذف الحملة لأنها تحتوي على ' +
        linkedPayments.length +
        ' سجل مدفوعات. غيّر حالتها إلى ARCHIVED بدلًا من حذفها.'
      );
    }

    sheet.deleteRow(campaign._rowNumber);

    return {
      ok: true,
      deletedCampaignId: String(campaignId)
    };
  }

  function deleteAdPayment(adPaymentId) {
    requirePermission('DELETE');

    var sheet = getPaidAdsSheet();
    var payment = findById(getObjects(sheet), 'Ad Payment ID', adPaymentId);

    if (!payment) {
      throw new Error('سجل الدفع غير موجود: ' + adPaymentId);
    }

    sheet.deleteRow(payment._rowNumber);

    return {
      ok: true,
      deletedAdPaymentId: String(adPaymentId)
    };
  }

  function getOverview(filters) {
    requirePermission('VIEW');

    var campaigns = listCampaigns(filters || {});
    var payments = listAdPayments(filters || {});
    var totalSpend = payments.reduce(function (sum, payment) {
      return sum + payment.amount;
    }, 0);

    var activeCampaigns = campaigns.filter(function (campaign) {
      return String(campaign.status).toUpperCase() === 'ACTIVE';
    });

    var totalBudget = campaigns.reduce(function (sum, campaign) {
      return sum + campaign.budget;
    }, 0);

    var spendByPlatform = {};

    payments.forEach(function (payment) {
      var platform = payment.platform || 'OTHER';

      if (!spendByPlatform[platform]) {
        spendByPlatform[platform] = 0;
      }

      spendByPlatform[platform] += payment.amount;
    });

    return {
      campaigns: campaigns,
      payments: payments.slice(0, 50),
      spendByPlatform: Object.keys(spendByPlatform)
        .map(function (platform) {
          return {
            platform: platform,
            amount: spendByPlatform[platform]
          };
        })
        .sort(function (a, b) {
          return b.amount - a.amount;
        }),
      summary: {
        campaignsCount: campaigns.length,
        activeCampaignsCount: activeCampaigns.length,
        totalBudget: totalBudget,
        totalSpend: totalSpend,
        remainingBudget: totalBudget - totalSpend,
        currency: 'EGP'
      }
    };
  }

  return {
    getOverview: getOverview,
    listCampaigns: listCampaigns,
    listAdPayments: listAdPayments,
    saveCampaign: saveCampaign,
    saveAdPayment: saveAdPayment,
    deleteCampaign: deleteCampaign,
    deleteAdPayment: deleteAdPayment
  };
})();


function adsGetOverview(filters) {
  return PaidAdsService.getOverview(filters || {});
}


function adsListCampaigns(filters) {
  return PaidAdsService.listCampaigns(filters || {});
}


function adsListPayments(filters) {
  return PaidAdsService.listAdPayments(filters || {});
}


function adsSaveCampaign(campaignData) {
  return PaidAdsService.saveCampaign(campaignData || {});
}


function adsSavePayment(paymentData) {
  return PaidAdsService.saveAdPayment(paymentData || {});
}


function adsDeleteCampaign(campaignId) {
  return PaidAdsService.deleteCampaign(campaignId);
}


function adsDeletePayment(adPaymentId) {
  return PaidAdsService.deleteAdPayment(adPaymentId);
}