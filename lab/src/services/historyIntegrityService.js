export function auditHistoryIntegrity({ products = [], sales = [], payments = [] } = {}) {
  const productIds = new Set(products.map((product) => product.id));
  const saleIds = new Set(sales.map((sale) => sale.id));

  const salesWithSnapshot = sales.filter((sale) => sale.customer && sale.productSnapshot && sale.total !== undefined);
  const salesMissingSnapshot = sales.filter((sale) => !sale.customer || !sale.productSnapshot || sale.total === undefined);
  const salesWithRemovedProductSafe = sales.filter((sale) => sale.originalProductId && !productIds.has(sale.originalProductId) && sale.productSnapshot && sale.total !== undefined);

  const paymentsWithSnapshot = payments.filter((payment) => payment.saleSnapshot && payment.amount !== undefined);
  const paymentsMissingSnapshot = payments.filter((payment) => !payment.saleSnapshot || payment.amount === undefined);
  const paymentsWithMissingSaleSafe = payments.filter((payment) => payment.saleId && !saleIds.has(payment.saleId) && payment.saleSnapshot && payment.amount !== undefined);

  const totalSalesValue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalPaymentsValue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return {
    ok: salesMissingSnapshot.length === 0 && paymentsMissingSnapshot.length === 0,
    counts: {
      products: products.length,
      sales: sales.length,
      payments: payments.length,
      salesWithSnapshot: salesWithSnapshot.length,
      salesMissingSnapshot: salesMissingSnapshot.length,
      paymentsWithSnapshot: paymentsWithSnapshot.length,
      paymentsMissingSnapshot: paymentsMissingSnapshot.length,
      salesWithRemovedProductSafe: salesWithRemovedProductSafe.length,
      paymentsWithMissingSaleSafe: paymentsWithMissingSaleSafe.length,
    },
    totals: {
      sales: totalSalesValue,
      payments: totalPaymentsValue,
    },
    warnings: [
      ...salesMissingSnapshot.map((sale) => `Venda sem snapshot completo: ${sale.id || 'sem-id'}`),
      ...paymentsMissingSnapshot.map((payment) => `Pagamento sem snapshot completo: ${payment.id || 'sem-id'}`),
    ],
    guarantees: [
      'Venda guarda customer e productSnapshot.',
      'Pagamento guarda saleSnapshot.',
      'Valor total da venda fica salvo na própria venda.',
      'Valor da parcela fica salvo no próprio pagamento.',
      'Histórico não depende da lista atual de produtos.',
    ],
  };
}
