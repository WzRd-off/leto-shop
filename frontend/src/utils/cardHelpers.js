export const EMPTY_CARD_FORM = {
  card_type: 'visa',
  card_number: '',
  exp_month: '',
  exp_year: '',
  cvv: '',
};

export function formatCardNumberInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function normalizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

export function validateCardForm(form) {
  const digits = normalizeCardNumber(form.card_number);
  if (digits.length < 13 || digits.length > 19) {
    return 'Введіть коректний номер картки (13–19 цифр)';
  }
  const month = Number(form.exp_month);
  const year = Number(form.exp_year);
  if (!month || month < 1 || month > 12) {
    return 'Вкажіть місяць закінчення (01–12)';
  }
  if (!year || year < new Date().getFullYear() || year > 2099) {
    return 'Вкажіть рік закінчення';
  }
  const expiry = new Date(year, month, 0, 23, 59, 59);
  if (expiry < new Date()) {
    return 'Термін дії картки закінчився';
  }
  const cvv = String(form.cvv || '').replace(/\D/g, '');
  if (cvv.length < 3 || cvv.length > 4) {
    return 'CVV має містити 3 або 4 цифри';
  }
  if (!['visa', 'mastercard'].includes(form.card_type)) {
    return 'Оберіть тип картки';
  }
  return null;
}
