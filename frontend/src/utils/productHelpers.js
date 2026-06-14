const CHAR_LABELS = {
  light: 'Освітлення',
  watering: 'Полив',
  height_cm: 'Висота (см)',
  humidity: 'Вологість',
  bloom: 'Квітування',
  pet_safe: 'Безпечно для тварин',
};

export function parseCharacteristics(chars) {
  if (!chars || typeof chars !== 'object') return { care: '', params: {} };
  const { care, ...rest } = chars;
  const params = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key === 'care') continue;
    const label = CHAR_LABELS[key] || key;
    params[label] = formatCharValue(value);
  }
  return { care: care || '', params };
}

function formatCharValue(value) {
  if (value === true) return 'Так';
  if (value === false) return 'Ні';
  return String(value);
}

const CHAR_GROUPS = [
  { title: 'Загальні відомості', keys: ['Висота (см)', 'Квітування', 'Безпечно для тварин'] },
  { title: 'Умови вирощування', keys: ['Освітлення', 'Полив', 'Вологість'] },
];

export function groupCharacteristics(params) {
  const groups = [];
  const used = new Set();

  for (const { title, keys } of CHAR_GROUPS) {
    const items = keys
      .filter((key) => params[key] != null)
      .map((key) => { used.add(key); return [key, params[key]]; });
    if (items.length) groups.push({ title, items });
  }

  const rest = Object.entries(params).filter(([k]) => !used.has(k));
  if (rest.length) groups.push({ title: 'Додатково', items: rest });

  return groups;
}
