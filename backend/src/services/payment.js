/** Учебный mock: мгновенный успех оплаты */
export function processPayment({ amount, userId }) {
  const ref = `PAY-MOCK-${Date.now()}-${userId}`;
  return {
    success: true,
    externalRef: ref,
    amount,
  };
}
