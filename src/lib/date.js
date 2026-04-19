export function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatDateLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
}

export function formatTime24(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function toDateInputValue(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
