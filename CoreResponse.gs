var Response = (function () {
  function output(payload) {
    return ContentService
      .createTextOutput(Utils.safeJsonStringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function success(data, meta) {
    return output({
      ok: true,
      data: data === undefined ? null : data,
      meta: Object.assign({
        timestamp: Utils.nowIso(),
        version: Constants.APP.VERSION
      }, meta || {})
    });
  }

  function error(code, message, details) {
    return output({
      ok: false,
      error: {
        code: code || 'INTERNAL_ERROR',
        message: message || 'An unexpected error occurred.',
        details: details || null
      },
      meta: {
        timestamp: Utils.nowIso(),
        version: Constants.APP.VERSION
      }
    });
  }

  function fromException(exception) {
    var message = exception && exception.message
      ? exception.message
      : String(exception);

    Logger.error('Unhandled request error', {
      message: message,
      stack: exception && exception.stack
    });

    return error(
      'INTERNAL_ERROR',
      'Unable to process this request.',
      { reason: message }
    );
  }

  return Object.freeze({
    success: success,
    error: error,
    fromException: fromException
  });
})();