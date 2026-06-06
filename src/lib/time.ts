export const BEIJING_TIME_ZONE = 'Asia/Shanghai';

type DateLike = string | number | Date | null | undefined;

function parseDate(value: DateLike, options: { assumePlainTimestampAsUtc?: boolean } = {}) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = options.assumePlainTimestampAsUtc && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)
    ? `${trimmed.replace(' ', 'T')}${trimmed.length === 16 ? ':00' : ''}Z`
    : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function partsForBeijing(value: DateLike, options: { assumePlainTimestampAsUtc?: boolean } = {}) {
  const date = parseDate(value, options);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BEIJING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

export function formatBeijingDate(value: DateLike, fallback = '未知时间') {
  const parts = partsForBeijing(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : fallback;
}

export function formatBeijingDateTime(value: DateLike, fallback = '未知时间', options: { assumePlainTimestampAsUtc?: boolean } = {}) {
  const parts = partsForBeijing(value, options);
  return parts ? `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}` : fallback;
}

export function formatBeijingTime(value: DateLike, fallback = '未知', options: { seconds?: boolean; assumePlainTimestampAsUtc?: boolean } = {}) {
  const parts = partsForBeijing(value, options);
  if (!parts) return fallback;
  return options.seconds ? `${parts.hour}:${parts.minute}:${parts.second}` : `${parts.hour}:${parts.minute}`;
}

export function currentBeijingDateTime() {
  return formatBeijingDateTime(new Date());
}
