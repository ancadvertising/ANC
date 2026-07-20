var BankingService = (function () {
  'use strict';

  var ACCOUNT_HEADERS = [
    'Bank Account ID',
    'Account Name',
    'Bank Name',
    'Account Number Masked',
    'Currency',
    'Opening Balance',
    'Active',
    'Created At',
    'Updated At'
  ];

  var TRANSACTION_HEADERS = [
    'Bank Transaction ID',
    'Bank Account ID',
    'Transaction Type',
    'Direction',
    'Amount',
    'Currency',
    'Transaction Date',
    'Reference Type',
    'Reference ID',
    'Description',
    'Created By',
    'Created At'
  ];

  function getSpreadsheet() {
    return Config.getSpreadsheet();
  }

  function getSheetName(key, fallbackName) {
    if (typeof Constants !== 'undefined' &&
        Constants.SHEETS &&
        Constants.SHEETS[key]) {
      return Constants.SHEETS[key];
    }

    return fallbackName;
  }

  function requirePermission(action) {
    if (typeof Security !== 'undefined' && Security.assertPermission) {
      Security.assertPermission('BILLING', action);
    }
  }

  function getCurrentUserEmail() {
    try {
      return Security.getCurrentEmail();
    } catch (error) {
      return '';
    }
  }

  function ensureSheet(sheetName, headers) {
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

  function getAccountsSheet() {
    return ensureSheet(
      getSheetName('BANK_ACCOUNTS', 'Bank Accounts'),
      ACCOUNT_HEADERS
    );
  }

  function getTransactionsSheet() {
    return ensureSheet(
      getSheetName('BANK_TRANSACTIONS', 'Bank Transactions'),
      TRANSACTION_HEADERS
    );
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
        var object = { _rowNumber: index + 2 };

        headers.forEach(function (header, columnIndex) {
          object[header] = row[columnIndex];
        });

        return object;
      })
      .filter(function (object) {
        return Object.keys(object).some(function (key) {
          return key !== '_rowNumber' &&
            object[key] !== '' &&
            object[key] !== null;
        });
      });
  }

  function toNumber(value) {
    var number = Number(value);
    return isNaN(number) ? 0 : number;
  }

  function toIsoDate(value) {
    if (!value) {
      return '';
    }

    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  }

  function findById(items, fieldName, id) {
    return items.find(function (item) {
      return String(item[fieldName] || '') === String(id || '');
    }) || null;
  }

  function cleanAccount(account, balance) {
    return {
      bankAccountId: String(account['Bank Account ID'] || ''),
      accountName: String(account['Account Name'] || ''),
      bankName: String(account['Bank Name'] || ''),
      accountNumberMasked: String(account['Account Number Masked'] || ''),
      currency: String(account['Currency'] || 'EGP'),
      openingBalance: toNumber(account['Opening Balance']),
      active: account['Active'] === true ||
        String(account['Active']).toUpperCase() === 'TRUE',
      availableBalance: balance,
      createdAt: toIsoDate(account['Created At']),
      updatedAt: toIsoDate(account['Updated At'])
    };
  }

  function cleanTransaction(transaction) {
    return {
      bankTransactionId: String(transaction['Bank Transaction ID'] || ''),
      bankAccountId: String(transaction['Bank Account ID'] || ''),
      transactionType: String(transaction['Transaction Type'] || ''),
      direction: String(transaction['Direction'] || ''),
      amount: toNumber(transaction['Amount']),
      currency: String(transaction['Currency'] || 'EGP'),
      transactionDate: toIsoDate(transaction['Transaction Date']),
      referenceType: String(transaction['Reference Type'] || ''),
      referenceId: String(transaction['Reference ID'] || ''),
      description: String(transaction['Description'] || ''),
      createdBy: String(transaction['Created By'] || ''),
      createdAt: toIsoDate(transaction['Created At'])
    };
  }

  function calculateBalances(accounts, transactions) {
    var balances = {};

    accounts.forEach(function (account) {
      balances[String(account['Bank Account ID'])] =
        toNumber(account['Opening Balance']);
    });

    transactions.forEach(function (transaction) {
      var accountId = String(transaction['Bank Account ID'] || '');
      var amount = toNumber(transaction['Amount']);
      var direction = String(transaction['Direction'] || '').toUpperCase();

      if (typeof balances[accountId] === 'undefined') {
        balances[accountId] = 0;
      }

      if (direction === 'CREDIT') {
        balances[accountId] += amount;
      } else if (direction === 'DEBIT') {
        balances[accountId] -= amount;
      }
    });

    return balances;
  }

  function listAccounts() {
    requirePermission('VIEW');

    var accounts = getObjects(getAccountsSheet());
    var transactions = getObjects(getTransactionsSheet());
    var balances = calculateBalances(accounts, transactions);

    return accounts.map(function (account) {
      return cleanAccount(
        account,
        balances[String(account['Bank Account ID'])] || 0
      );
    });
  }

  function createAccount(data) {
    requirePermission('CREATE');

    data = data || {};

    if (!String(data.accountName || '').trim()) {
      throw new Error('اسم الحساب البنكي مطلوب.');
    }

    if (!String(data.bankName || '').trim()) {
      throw new Error('اسم البنك مطلوب.');
    }

    var now = new Date().toISOString();
    var account = {
      'Bank Account ID': 'BNK-' + Utilities.getUuid(),
      'Account Name': String(data.accountName).trim(),
      'Bank Name': String(data.bankName).trim(),
      'Account Number Masked': String(data.accountNumberMasked || '').trim(),
      'Currency': String(data.currency || 'EGP').trim().toUpperCase(),
      'Opening Balance': toNumber(data.openingBalance),
      'Active': true,
      'Created At': now,
      'Updated At': now
    };

    getAccountsSheet().appendRow(ACCOUNT_HEADERS.map(function (header) {
      return account[header];
    }));

    return cleanAccount(account, toNumber(account['Opening Balance']));
  }

  function getAccountOrThrow(accountId) {
    var account = findById(
      getObjects(getAccountsSheet()),
      'Bank Account ID',
      accountId
    );

    if (!account) {
      throw new Error('الحساب البنكي غير موجود: ' + accountId);
    }

    if (account['Active'] !== true &&
        String(account['Active']).toUpperCase() !== 'TRUE') {
      throw new Error('الحساب البنكي غير نشط.');
    }

    return account;
  }

  function addTransaction(data) {
    data = data || {};

    if (!data.bankAccountId) {
      throw new Error('الحساب البنكي مطلوب.');
    }

    if (toNumber(data.amount) <= 0) {
      throw new Error('قيمة الحركة يجب أن تكون أكبر من صفر.');
    }

    var account = getAccountOrThrow(data.bankAccountId);
    var now = new Date().toISOString();

    var transaction = {
      'Bank Transaction ID': 'BTR-' + Utilities.getUuid(),
      'Bank Account ID': String(data.bankAccountId),
      'Transaction Type': String(data.transactionType || 'OTHER').toUpperCase(),
      'Direction': String(data.direction || 'DEBIT').toUpperCase(),
      'Amount': toNumber(data.amount),
      'Currency': String(data.currency || account['Currency'] || 'EGP').toUpperCase(),
      'Transaction Date': data.transactionDate
        ? new Date(data.transactionDate).toISOString()
        : now,
      'Reference Type': String(data.referenceType || '').toUpperCase(),
      'Reference ID': String(data.referenceId || ''),
      'Description': String(data.description || ''),
      'Created By': getCurrentUserEmail(),
      'Created At': now
    };

    getTransactionsSheet().appendRow(TRANSACTION_HEADERS.map(function (header) {
      return transaction[header];
    }));

    return cleanTransaction(transaction);
  }

  function addDeposit(data) {
    requirePermission('CREATE');

    data = data || {};

    return addTransaction({
      bankAccountId: data.bankAccountId,
      transactionType: 'DEPOSIT',
      direction: 'CREDIT',
      amount: data.amount,
      currency: data.currency,
      transactionDate: data.transactionDate,
      referenceType: 'DEPOSIT',
      referenceId: data.referenceId || '',
      description: data.description || 'إيداع لتغطية مصروفات الإعلانات'
    });
  }

  function recordAdSpend(data) {
    requirePermission('CREATE');

    data = data || {};

    var accountId = String(data.bankAccountId || '');
    var amount = toNumber(data.amount);

    if (!accountId || amount <= 0) {
      throw new Error('الحساب البنكي وقيمة خصم الإعلان مطلوبان.');
    }

    var accounts = listAccounts();
    var account = accounts.find(function (item) {
      return item.bankAccountId === accountId;
    });

    if (!account) {
      throw new Error('الحساب البنكي غير موجود.');
    }

    if (amount > account.availableBalance) {
      throw new Error(
        'الرصيد المتاح غير كافٍ. الرصيد الحالي: ' +
        account.availableBalance +
        ' ' +
        account.currency
      );
    }

    return addTransaction({
      bankAccountId: accountId,
      transactionType: 'AD_SPEND',
      direction: 'DEBIT',
      amount: amount,
      currency: data.currency || account.currency,
      transactionDate: data.transactionDate,
      referenceType: 'AD_PAYMENT',
      referenceId: data.adPaymentId || '',
      description: data.description || 'خصم تكلفة إعلان ممول'
    });
  }

  function listTransactions(filters) {
    requirePermission('VIEW');

    filters = filters || {};

    var accountId = String(filters.bankAccountId || '');
    var direction = String(filters.direction || '').toUpperCase();
    var type = String(filters.transactionType || '').toUpperCase();

    return getObjects(getTransactionsSheet())
      .map(cleanTransaction)
      .filter(function (transaction) {
        return (!accountId || transaction.bankAccountId === accountId) &&
          (!direction || transaction.direction === direction) &&
          (!type || transaction.transactionType === type);
      })
      .sort(function (a, b) {
        return new Date(b.transactionDate || b.createdAt) -
          new Date(a.transactionDate || a.createdAt);
      });
  }

  function getOverview() {
    requirePermission('VIEW');

    var accounts = listAccounts();
    var transactions = listTransactions({});

    var totalDeposits = transactions
      .filter(function (transaction) {
        return transaction.transactionType === 'DEPOSIT';
      })
      .reduce(function (sum, transaction) {
        return sum + transaction.amount;
      }, 0);

    var totalAdSpend = transactions
      .filter(function (transaction) {
        return transaction.transactionType === 'AD_SPEND';
      })
      .reduce(function (sum, transaction) {
        return sum + transaction.amount;
      }, 0);

    return {
      accounts: accounts,
      transactions: transactions.slice(0, 50),
      summary: {
        accountsCount: accounts.length,
        totalAvailableBalance: accounts.reduce(function (sum, account) {
          return sum + account.availableBalance;
        }, 0),
        totalDeposits: totalDeposits,
        totalAdSpend: totalAdSpend,
        coverageBalance: totalDeposits - totalAdSpend,
        currency: 'EGP'
      }
    };
  }

  return {
    listAccounts: listAccounts,
    createAccount: createAccount,
    addDeposit: addDeposit,
    recordAdSpend: recordAdSpend,
    listTransactions: listTransactions,
    getOverview: getOverview
  };
})();

function bankGetOverview() {
  return BankingService.getOverview();
}

function bankListAccounts() {
  return BankingService.listAccounts();
}

function bankCreateAccount(accountData) {
  return BankingService.createAccount(accountData || {});
}

function bankAddDeposit(depositData) {
  return BankingService.addDeposit(depositData || {});
}

function bankListTransactions(filters) {
  return BankingService.listTransactions(filters || {});
}