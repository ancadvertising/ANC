var ClientService = (function () {
  function list() {
    return DataStore.list(Constants.SHEETS.CLIENTS);
  }

  function get(clientId) {
    var client = DataStore.findById(
      Constants.SHEETS.CLIENTS,
      'Client ID',
      clientId
    );

    if (!client) {
      throw new Error('Client not found: ' + clientId);
    }

    return client;
  }

  function create(payload) {
    Utils.requireFields(payload, ['clientName']);

    var timestamp = Utils.nowIso();
    var status = payload.status
      ? Utils.normalizeEnum(payload.status, Constants.CLIENT_STATUSES, 'Client status')
      : 'LEAD';

    var client = DataStore.create(Constants.SHEETS.CLIENTS, {
      'Client ID': Utils.newId('CLT'),
      'Client Name': payload.clientName.trim(),
      'Status': status,
      'Primary Contact': payload.primaryContact || '',
      'Email': payload.email || '',
      'Phone': payload.phone || '',
      'Industry': payload.industry || '',
      'Account Manager': payload.accountManager || '',
      'Created At': timestamp,
      'Updated At': timestamp
    });

    Logger.audit('CLIENT_CREATED', 'CLIENT', client['Client ID'], client);
    return client;
  }

  function update(clientId, payload) {
    get(clientId);

    var changes = {
      'Updated At': Utils.nowIso()
    };

    if (payload.clientName !== undefined) changes['Client Name'] = payload.clientName;
    if (payload.primaryContact !== undefined) changes['Primary Contact'] = payload.primaryContact;
    if (payload.email !== undefined) changes['Email'] = payload.email;
    if (payload.phone !== undefined) changes['Phone'] = payload.phone;
    if (payload.industry !== undefined) changes['Industry'] = payload.industry;
    if (payload.accountManager !== undefined) changes['Account Manager'] = payload.accountManager;

    if (payload.status !== undefined) {
      changes['Status'] = Utils.normalizeEnum(
        payload.status,
        Constants.CLIENT_STATUSES,
        'Client status'
      );
    }

    var client = DataStore.updateById(
      Constants.SHEETS.CLIENTS,
      'Client ID',
      clientId,
      changes
    );

    Logger.audit('CLIENT_UPDATED', 'CLIENT', clientId, changes);
    return client;
  }

  return Object.freeze({
    list: list,
    get: get,
    create: create,
    update: update
  });
})();