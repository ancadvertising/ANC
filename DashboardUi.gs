function getEnhancedDashboardData() {
  return {
    dashboard: DashboardService.summary(),
    invoices: InvoiceService.list().slice(-5).reverse(),
    expenses: ExpenseService.list().slice(-5).reverse()
  };
}