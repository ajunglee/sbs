export function resolveMediaUrl(value) {
  if (!value || typeof value !== 'string') return '';

  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;

  if (normalizedPath.startsWith('/uploads/')) {
    return `${window.location.origin}${normalizedPath}`;
  }

  return `${window.location.origin}${normalizedPath}`;
}
