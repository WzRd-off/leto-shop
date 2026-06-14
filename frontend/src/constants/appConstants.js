export const STATUS_LIST = [
  { id: 1, name: 'Отримано', color: '#2196F3', bg: '#E3F2FD' },
  { id: 2, name: 'В обробці', color: '#FF9800', bg: '#FFF3E0' },
  { id: 3, name: 'Відправлено', color: '#8BC34A', bg: '#F1F8E9' },
  { id: 4, name: 'Доставлено', color: '#616161', bg: '#F5F5F5' },
  { id: 5, name: 'Закрито', color: '#007D00', bg: '#E3F0DB' },
];

export const STATUS_MAP = Object.fromEntries(
  STATUS_LIST.map((s) => [s.name, { color: s.color, bg: s.bg, label: s.name }])
);

export function statusMeta(nameOrId) {
  return (
    STATUS_LIST.find(
      (s) =>
        s.name.toLowerCase() === nameOrId?.toString().toLowerCase() || s.id === nameOrId
    ) || { name: nameOrId ?? '—', color: '#616161', bg: '#F5F5F5' }
  );
}

export const MIN_ORDER_UAH = 350;

export const CATEGORIES = [
  'Кімнатні рослини',
  'Квіти',
  'Екзотика',
];

export const CATEGORY_META = {
  'Кімнатні рослини': {
    description: 'Монстера, фікус, сансевієрія та інші зелені улюбленці',
    gradient: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)',
  },
  'Квіти': {
    description: 'Орхідеї, фіалки, антуріуми — квітучі рослини для дому',
    gradient: 'linear-gradient(135deg, #6a1b9a 0%, #ab47bc 100%)',
  },
  'Екзотика': {
    description: 'Рідкісні тропічні рослини для справжніх колекціонерів',
    gradient: 'linear-gradient(135deg, #006064 0%, #26a69a 100%)',
  },
};

export const CARD_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
];

export function cardTypeLabel(cardType) {
  return CARD_TYPES.find((c) => c.value === cardType)?.label || cardType;
}

export function formatCardDisplay(card) {
  if (!card) return '—';
  const type = cardTypeLabel(card.card_type);
  const exp = card.exp_month && card.exp_year
    ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`
    : '';
  return `${type} •••• ${card.last_four}${exp ? `, до ${exp}` : ''}`;
}

export function categoryToSlug(category) {
  return encodeURIComponent(category);
}

export function slugToCategory(slug) {
  return decodeURIComponent(slug);
}

export function numericOnKeyDown(e) {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', ','];
  if (allowed.includes(e.key) || (e.key >= '0' && e.key <= '9')) return;
  e.preventDefault();
}
