var APP_VERSION = '1.0.0';

/*
 * ط±ط§ط¨ط· ط§ظ„ظ†ط´ط± ط§ظ„ط±ط³ظ…ظٹ ظ„ظ„طھط·ط¨ظٹظ‚.
 * ظ„ط§ طھط؛ظٹظ‘ط±ظ‡ ط¥ظ„ط§ ط¹ظ†ط¯ ط¥ظ†ط´ط§ط، Deployment ط¬ط¯ظٹط¯ ط¨ط±ط§ط¨ط· ظ…ط®طھظ„ظپ.
 */
var ANC_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwDSD5A7qYB5-YTXHFmn4gKlaLOQtVVdGbcF2q1E7iGhv251UfeRluZAHoIpEP4eYOP/exec';

/*
 * ظƒظ„ طµظپط­ط© ظ„ظ‡ط§ ط£ظƒط«ط± ظ…ظ† ط§ط³ظ… ظ…ط­طھظ…ظ„ ط­طھظ‰ ظ„ط§ ظٹطھط¹ط·ظ„ ط§ظ„ظ†ط¸ط§ظ…
 * ط¥ط°ط§ ظƒط§ظ† ط§ط³ظ… ظ…ظ„ظپ HTML ظ…ط®طھظ„ظپظ‹ط§ ط¨ظٹظ† ط§ظ„ط¥طµط¯ط§ط±ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©.
 */
var PAGE_FILES = {
  dashboard: ['Index', 'Dashboard'],
  crm: ['CrmPage', 'CRM', 'crm'],
  ads: ['AdsPage', 'PaidAdsPage', 'Ads'],
  studio: ['StudioPage', 'Studio'],
  operations: ['Operations', 'OperationsPage'],
  tasks: ['TasksPage', 'Tasks', 'Operations', 'OperationsPage'],
  employeeportal: ['EmployeePortal'],
  clientportal: ['ClientPortal'],
  adminportal: ['UserManagementPage'],
  users: ['UserManagementPage', 'AdminPortal'],
  finance: ['finance', 'FinancePage', 'Finance'],
  billing: ['FinancePage', 'finance', 'Finance'],
  profitability: ['ProfitabilityPage', 'Profitability'],
  documents: ['DocumentsPage', 'Documents'],
  reports: ['ReportsPage', 'Reports'],
  alerts: ['AlertsPage', 'Alerts'],
  audit: ['AuditPage', 'Audit'],
  status: ['StatusPage', 'Status'],
  settings: ['SettingsPage', 'Settings']
};

var PAGE_TITLES = {
  dashboard: 'ظ„ظˆط­ط© ط§ظ„ظ…ط¤ط´ط±ط§طھ | ANC ERP',
  crm: 'ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ظ„ظ…ط´ط±ظˆط¹ط§طھ | ANC ERP',
  ads: 'ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ظ…ظ…ظˆظ„ط© | ANC ERP',
  studio: 'ط§ظ„ط§ط³طھظˆط¯ظٹظˆ | ANC ERP',
  operations: 'ط§ظ„طھط´ط؛ظٹظ„ ظˆط§ظ„ظ…ظ‡ط§ظ… | ANC ERP',
  tasks: 'ط§ظ„ظ…ظ‡ط§ظ… | ANC ERP',
  employeeportal: 'ط¨ظˆط§ط¨ط© ط§ظ„ظ…ظˆط¸ظپ | ANC ERP',
  clientportal: 'ط¨ظˆط§ط¨ط© ط§ظ„ط¹ظ…ظٹظ„ | ANC ERP',
  adminportal: 'ط¥ط¯ط§ط±ط© ط§ظ„ظ†ط¸ط§ظ… | ANC ERP',
  users: 'ط¥ط¯ط§ط±ط© ط§ظ„ط­ط³ط§ط¨ط§طھ | ANC ERP',
  finance: 'ط§ظ„ظپظˆط§طھظٹط± ظˆط§ظ„ظ…ط¯ظپظˆط¹ط§طھ | ANC ERP',
  billing: 'ط§ظ„ط­ط³ط§ط¨ط§طھ ظˆط§ظ„ظپظˆط§طھظٹط± | ANC ERP',
  profitability: 'ط§ظ„ظ…طµط±ظˆظپط§طھ ظˆط§ظ„ط±ط¨ط­ظٹط© | ANC ERP',
  documents: 'ط§ظ„ظ…ط³طھظ†ط¯ط§طھ | ANC ERP',
  reports: 'ط§ظ„طھظ‚ط§ط±ظٹط± | ANC ERP',
  alerts: 'ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ | ANC ERP',
  audit: 'ط³ط¬ظ„ ط§ظ„ظ†ط´ط§ط· | ANC ERP',
  status: 'طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط§طھ | ANC ERP',
  settings: 'ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ… | ANC ERP'
};

/**
 * ظ†ظ‚ط·ط© ط¯ط®ظˆظ„ طµظپط­ط§طھ ط§ظ„ظ†ط¸ط§ظ….
 */
function doGet(e) {
  var parameters = getRequestParameters(e);

  try {
    /*
     * ط£ظٹ ط·ظ„ط¨ API ظٹط°ظ‡ط¨ ط¥ظ„ظ‰ Router ظˆظ„ط§ ظٹطھظ… ط¹ط±ط¶ظ‡ ظƒطµظپط­ط© HTML.
     */
    if (
      parameters.route ||
      parameters.action ||
      parameters.resource ||
      parameters.endpoint
    ) {
      return handleApiRequest('GET', e);
    }

    var identity = getGoogleIdentitySafely();
    var requestedPage = normalizePageName(parameters.page);

    /*
     * ظ„ط§ طھظˆط¬ط¯ طµظپط­ط© Login ظپظٹ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط¬ط¯ظٹط¯.
     * ط­طھظ‰ ظ„ظˆ ظˆظڈط¬ط¯ ط±ط§ط¨ط· ظ‚ط¯ظٹظ… ظپظٹظ‡ page=login ط³ظٹطھظ… طھط­ظˆظٹظ„ظ‡ طھظ„ظ‚ط§ط¦ظٹظ‹ط§
     * ط¥ظ„ظ‰ ط§ظ„طµظپط­ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ظ…ط³طھط®ط¯ظ….
     */
    if (!requestedPage || requestedPage === 'login') {
      requestedPage = defaultPageFor(identity);
    }

    assertGooglePageAccess(requestedPage, identity);

    var html = getPageHtmlContent(requestedPage);
    html = injectResponsiveStyles(rewriteInternalLinks(html));

    return HtmlService.createHtmlOutput(html)
      .setTitle(PAGE_TITLES[requestedPage] || 'ANC ERP')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    return renderApplicationError(error);
  }
}

/**
 * ظ†ظ‚ط·ط© ط¯ط®ظˆظ„ ط·ظ„ط¨ط§طھ POST ط§ظ„ط®ط§طµط© ط¨ط§ظ„ظ€ API.
 */
function doPost(e) {
  try {
    return handleApiRequest('POST', e);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error && error.message ? error.message : 'Unable to process request.'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: APP_VERSION
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ظٹط­ط¯ط¯ ط§ظ„طµظپط­ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© ظˆظپظ‚ظ‹ط§ ظ„ط­ط³ط§ط¨ Google ط§ظ„ط­ط§ظ„ظٹ.
 */
function defaultPageFor(identity) {
  if (identity && identity.userType === 'CLIENT') {
    return 'clientportal';
  }

  if (identity && identity.userType === 'EMPLOYEE') {
    return 'employeeportal';
  }

  return 'dashboard';
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط­ظ‚ ط§ظ„ظˆطµظˆظ„ ظ„ظ„طµظپط­ط§طھ ظپظٹ ظ†ظ…ط· طھط³ط¬ظٹظ„ Google ط§ظ„ظ…ط¨ط§ط´ط±.
 */
function assertGooglePageAccess(page, identity) {
  if (!PAGE_FILES[page]) {
    throw new Error('ط§ظ„طµظپط­ط© ط§ظ„ظ…ط·ظ„ظˆط¨ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©: ' + page);
  }

  if (!identity || !identity.email) {
    throw new Error(
      'طھط¹ط°ط± ط§ظ„طھط¹ط±ظپ ط¹ظ„ظ‰ ط­ط³ط§ط¨ Google ط§ظ„ط­ط§ظ„ظٹ. طھط£ظƒط¯ ط£ظ† ط¥ط¹ط¯ط§ط¯ Web App ظ‡ظˆ: Execute as user accessing the web app.'
    );
  }

  if (identity.userType === 'CLIENT' && page !== 'clientportal') {
    throw new Error('ظ„ظٹط³ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط© ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط©.');
  }

  if (identity.userType === 'EMPLOYEE' && page !== 'employeeportal') {
    throw new Error('ظ„ظٹط³ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط© ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط©.');
  }

  if (
    page === 'users' ||
    page === 'adminportal'
  ) {
    var isAdmin =
      identity.userType === 'ADMIN' ||
      identity.role === 'ADMIN' ||
      identity.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      throw new Error('ظ‡ط°ظ‡ ط§ظ„طµظپط­ط© ظ…طھط§ط­ط© ظ„ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ظپظ‚ط·.');
    }
  }
}

/**
 * ظٹط­ط§ظˆظ„ ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ‡ظˆظٹط© ط§ظ„ظ…ط³طھط®ط¯ظ… ط¯ظˆظ† طھط¹ط·ظٹظ„ ط§ظ„ظ†ط¸ط§ظ…
 * ط¥ط°ط§ ظƒط§ظ† ظ…ظ„ظپ GoogleIdentity.gs ظ„ظ… ظٹظڈط¶ظپ ط¨ط¹ط¯.
 */
function getGoogleIdentitySafely() {
  if (typeof GoogleIdentity !== 'undefined' && GoogleIdentity.resolve) {
    return GoogleIdentity.resolve();
  }

  var email = '';

  try {
    email = Session.getActiveUser().getEmail();
  } catch (ignore) {
    email = '';
  }

  return {
    email: String(email || '').trim().toLowerCase(),
    userType: 'ADMIN',
    role: 'ADMIN',
    fullName: 'Administrator'
  };
}

/**
 * ظٹط¨ط­ط« ط¹ظ† ط£ظˆظ„ ظ…ظ„ظپ HTML ظ…ظˆط¬ظˆط¯ ظ…ظ† ط£ط³ظ…ط§ط، ط§ظ„طµظپط­ط© ط§ظ„ظ…ط­طھظ…ظ„ط©.
 */
function getPageHtmlContent(page) {
  var candidates = PAGE_FILES[page];

  if (!candidates || !candidates.length) {
    throw new Error('ظ„ظ… ظٹطھظ… طھط¹ط±ظٹظپ ظ…ظ„ظپط§طھ ط§ظ„طµظپط­ط©: ' + page);
  }

  var lastError = null;

  for (var i = 0; i < candidates.length; i++) {
    try {
      return HtmlService.createHtmlOutputFromFile(candidates[i]).getContent();
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    'ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ظ„ظپ HTML ظ„ظ„طµظپط­ط© "' +
    page +
    '". ط§ظ„ط£ط³ظ…ط§ط، ط§ظ„طھظٹ طھظ… ط§ظ„ط¨ط­ط« ط¹ظ†ظ‡ط§: ' +
    candidates.join(', ') +
    (lastError ? ' | ' + lastError.message : '')
  );
}

/**
 * ظٹط¶ظٹظپ Base URL طµط­ظٹط­ظ‹ط§ + ظ…ط¹ط§ظ„ط¬ ط´ط§ظ…ظ„ ظ„ظ„ط±ظˆط§ط¨ط· ط§ظ„ط¯ط§ط®ظ„ظٹط©.
 *
 * ظ‡ط°ط§ ظ‡ظˆ ط§ظ„ط¬ط²ط، ط§ظ„ط°ظٹ ظٹظ…ظ†ط¹ ط§ظ„ط§ظ†طھظ‚ط§ظ„ ط¥ظ„ظ‰ userCodeAppPanel ط£ظˆ googleusercontent
 * ظˆظٹط¬ط¹ظ„ ظƒظ„ ?page=crm ظˆ ?page=ads ظˆط؛ظٹط±ظ‡ظ…ط§ ظٹظپطھط­ ظ…ظ† ط±ط§ط¨ط· /exec ط§ظ„ط±ط³ظ…ظٹ.
 */
function injectWebAppNavigation(html) {
  var appUrl = getWebAppUrl();
  var safeUrl = escapeHtmlAttribute(appUrl);

  var navigationScript =
    '<base href="' + safeUrl + '" target="_top">' +
    '<script>' +
    '(function () {' +
    '  var APP_URL = ' + JSON.stringify(appUrl) + ';' +
    '  window.ANC_WEB_APP_URL = APP_URL;' +
    '' +
    '  function isInternalPageLink(rawHref) {' +
    '    if (!rawHref) return false;' +
    '    return rawHref.indexOf("?page=") === 0 ||' +
    '      rawHref.indexOf("&page=") === 0 ||' +
    '      rawHref.indexOf("./?page=") === 0;' +
    '  }' +
    '' +
    '  function openInternalPage(rawHref) {' +
    '    var cleanHref = String(rawHref || "");' +
    '    if (cleanHref.indexOf("./") === 0) {' +
    '      cleanHref = cleanHref.substring(2);' +
    '    }' +
    '    if (cleanHref.indexOf("&") === 0) {' +
    '      cleanHref = "?" + cleanHref.substring(1);' +
    '    }' +
    '    var targetUrl = APP_URL + cleanHref;' +
    '    try {' +
    '      window.top.location.href = targetUrl;' +
    '    } catch (error) {' +
    '      window.location.href = targetUrl;' +
    '    }' +
    '  }' +
    '' +
    '  document.addEventListener("click", function (event) {' +
    '    var element = event.target;' +
    '    while (element && element.tagName !== "A" && element.tagName !== "BUTTON") {' +
    '      element = element.parentElement;' +
    '    }' +
    '    if (!element) return;' +
    '' +
    '    var rawHref = element.getAttribute("href") ||' +
    '      element.getAttribute("data-page-url") ||' +
    '      element.getAttribute("data-href");' +
    '' +
    '    if (isInternalPageLink(rawHref)) {' +
    '      event.preventDefault();' +
    '      event.stopPropagation();' +
    '      openInternalPage(rawHref);' +
    '    }' +
    '  }, true);' +
    '' +
    '  window.ancNavigate = function (page) {' +
    '    var normalized = String(page || "dashboard").replace(/[^a-z]/gi, "").toLowerCase();' +
    '    openInternalPage("?page=" + encodeURIComponent(normalized));' +
    '  };' +
    '})();' +
    '</script>';

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, function (headTag) {
      return headTag + navigationScript;
    });
  }

  return navigationScript + html;
}

/**
 * ط±ط§ط¨ط· ط§ظ„ظ€ Deployment ط§ظ„طµط­ظٹط­.
 * ظٹظ…ظƒظ† طھط؛ظٹظٹط±ظ‡ ط¯ظˆظ† طھط¹ط¯ظٹظ„ ط§ظ„ظƒظˆط¯ ظ…ظ† Script Properties ط¹ط¨ط± ANC_WEB_APP_URL.
 */
function getWebAppUrl() {
  try {
    var configuredUrl = PropertiesService
      .getScriptProperties()
      .getProperty('ANC_WEB_APP_URL');

    if (configuredUrl && String(configuredUrl).trim()) {
      return String(configuredUrl).trim().replace(/\/$/, '');
    }
  } catch (ignore) {
    // ظٹط³طھط®ط¯ظ… ط§ظ„ط±ط§ط¨ط· ط§ظ„ط«ط§ط¨طھ ط£ط¯ظ†ط§ظ‡.
  }

  if (ANC_WEB_APP_URL && ANC_WEB_APP_URL.indexOf('/exec') > -1) {
    return ANC_WEB_APP_URL.replace(/\/$/, '');
  }

  try {
    var serviceUrl = ScriptApp.getService().getUrl();

    if (serviceUrl) {
      return String(serviceUrl).replace(/\/$/, '');
    }
  } catch (ignoreServiceUrl) {
    // ظ„ط§ ط´ظٹط،.
  }

  throw new Error('ظ„ظ… ظٹطھظ… ط¥ط¹ط¯ط§ط¯ ط±ط§ط¨ط· Web App.');
}

/**
 * ظٹط¹ط§ظ„ط¬ ط·ظ„ط¨ط§طھ Router ط§ظ„ظ‚ط¯ظٹظ…ط© ظˆط§ظ„ط¬ط¯ظٹط¯ط©.
 */
function handleApiRequest(method, event) {
  if (typeof Router === 'undefined' || !Router.handle) {
    throw new Error('ظ…ظ„ظپ Router.gs ط£ظˆ ط§ظ„ط¯ط§ظ„ط© Router.handle ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©.');
  }

  return Router.handle(event, method);
}

/**
 * ظٹط¬ظ…ط¹ ط§ظ„ظ…ط¹ظ„ظ…ط§طھ ط§ظ„ظˆط§ط±ط¯ط© ظ…ظ† GET ط£ظˆ POST.
 */
function getRequestParameters(event) {
  var result = {};

  if (!event) {
    return result;
  }

  if (event.parameter) {
    for (var key in event.parameter) {
      if (Object.prototype.hasOwnProperty.call(event.parameter, key)) {
        result[key] = event.parameter[key];
      }
    }
  }

  if (event.parameters) {
    for (var parameterName in event.parameters) {
      if (
        Object.prototype.hasOwnProperty.call(event.parameters, parameterName) &&
        result[parameterName] === undefined
      ) {
        result[parameterName] = event.parameters[parameterName][0];
      }
    }
  }

  return result;
}

/**
 * طھظˆط­ظٹط¯ ط§ط³ظ… ط§ظ„طµظپط­ط© ظ‚ط¨ظ„ ط§ط³طھط®ط¯ط§ظ…ظ‡.
 */
function normalizePageName(page) {
  if (!page) {
    return '';
  }

  return String(page)
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * طµظپط­ط© ط®ط·ط£ ظˆط§ط¶ط­ط© ط¨ط¯ظ„ ط§ظ„ط´ط§ط´ط© ط§ظ„ط¨ظٹط¶ط§ط،.
 */
function renderApplicationError(error) {
  var message = error && error.message
    ? error.message
    : 'ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹.';

  var safeMessage = escapeHtml(message);
  var dashboardUrl = getWebAppUrl() + '?page=dashboard';

  var html =
    '<!DOCTYPE html>' +
    '<html lang="ar" dir="rtl">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>طھط¹ط°ط± ظپطھط­ ط§ظ„طµظپط­ط© | ANC ERP</title>' +
    '<style>' +
    'body{margin:0;min-height:100vh;background:#0b0c0e;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px;box-sizing:border-box}' +
    '.box{width:min(520px,100%);background:#17191d;border:1px solid #333842;border-radius:20px;padding:32px;box-sizing:border-box;text-align:right}' +
    'h1{margin:0 0 16px;color:#b7ff2a;font-size:24px}' +
    'p{color:#c7cad0;line-height:1.8;word-break:break-word}' +
    'a{display:inline-block;margin-top:18px;background:#a8f52b;color:#121512;text-decoration:none;font-weight:bold;border-radius:10px;padding:12px 18px}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="box">' +
    '<h1>طھط¹ط°ط± ظپطھط­ ط§ظ„طµظپط­ط©</h1>' +
    '<p>' + safeMessage + '</p>' +
    '<a href="' + escapeHtmlAttribute(dashboardUrl) + '" target="_top">ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ظ„ظˆط­ط© ط§ظ„ظ…ط¤ط´ط±ط§طھ</a>' +
    '</div>' +
    '</body>' +
    '</html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('طھط¹ط°ط± ظپطھط­ ط§ظ„طµظپط­ط© | ANC ERP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value);
}
function rewriteInternalLinks(html) {
  var baseUrl = getWebAppUrl();
  return String(html || '')
    .replace(/href="\?page=([a-zA-Z]+)"/g, function(_, page) {
      return 'href="' + baseUrl + '?page=' + encodeURIComponent(String(page).toLowerCase()) + '" target="_top"';
    })
    .replace(/href="\?"/g, 'href="' + baseUrl + '?page=dashboard" target="_top"');
}

function injectResponsiveStyles(html) {
  var css = '<style id="anc-responsive-ui">' +
    '*,*:before,*:after{box-sizing:border-box}' +
    'img,canvas,svg{max-width:100%;height:auto}' +
    'button,input,select,textarea{max-width:100%}' +
    '.table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    '@media(max-width:1100px){.metrics,.dashboard-grid,.tables,.grid,.stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.app{gap:12px!important}}' +
    '@media(max-width:780px){html,body{width:100%;overflow-x:hidden}.app{display:block!important;padding:8px!important}.app>aside,aside,.side{position:static!important;width:100%!important;min-height:0!important;height:auto!important;margin:0 0 12px!important;padding:12px!important;border-radius:14px!important}.brand{padding:4px 8px 10px!important}.section-label,.footer{display:none!important}aside nav,.side nav{display:flex!important;flex-wrap:nowrap!important;gap:6px!important;overflow-x:auto!important;padding:4px 0!important;-webkit-overflow-scrolling:touch}.nav-item,.nav{display:inline-flex!important;flex:0 0 auto!important;align-items:center!important;min-height:44px!important;white-space:nowrap!important;margin:0!important;padding:0 12px!important}.app main,main,.main{min-width:0!important;padding:16px!important}.metrics,.dashboard-grid,.tables,.grid,.stats{grid-template-columns:1fr!important;gap:12px!important}.top,header{flex-wrap:wrap!important;gap:10px!important}.panel,.card,.stat{min-width:0!important}.table-wrap,table{max-width:100%}table{min-width:600px!important}th,td{padding:10px 9px!important;font-size:12px!important}button,input,select,textarea{min-height:44px!important;font-size:16px!important}textarea{min-height:110px!important}.modal,.dialog,[role=dialog]{width:calc(100vw - 24px)!important;max-width:calc(100vw - 24px)!important;margin:12px!important}.chart-wrap{min-height:220px!important}.refresh{min-width:44px!important;min-height:44px!important}}' +
    '</style>';
  return String(html || '').replace(/<\/head>/i, css + '</head>');
}

