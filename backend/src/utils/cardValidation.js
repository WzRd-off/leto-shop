const CARD_TYPES = ['visa', 'mastercard'];

export function normalizeCardNumber(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function validateCardPayload({ card_type, card_number, exp_month, exp_year, cvv }) {
  if (!CARD_TYPES.includes(card_type)) {
    return 'Оберіть тип картки: Visa або Mastercard';
  }

  const digits = normalizeCardNumber(card_number);
  if (digits.length < 13 || digits.length > 19) {
    return 'Номер картки має містити від 13 до 19 цифр';
  }

  const month = Number(exp_month);
  const year = Number(exp_year);
  if (!month || month < 1 || month > 12) {
    return 'Вкажіть коректний місяць закінчення (01–12)';
  }
  if (!year || year < 2024 || year > 2099) {
    return 'Вкажіть коректний рік закінчення';
  }

  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);
  if (expiry < now) {
    return 'Термін дії картки закінчився';
  }

  const cvvStr = String(cvv || '').replace(/\D/g, '');
  if (cvvStr.length < 3 || cvvStr.length > 4) {
    return 'CVV має містити 3 або 4 цифри';
  }

  return null;
}

export function cardTypeLabel(cardType) {
  return cardType === 'mastercard' ? 'Mastercard' : 'Visa';
}
