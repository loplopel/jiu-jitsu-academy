export function extractCheckinToken(raw: string, baseUrl = 'http://localhost') {
  const value = String(raw || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value, baseUrl);
    const token = url.searchParams.get('token');
    if (token) return token.trim();
  } catch {}

  // Também aceita somente o token, útil para leitores que retornam o conteúdo bruto.
  if (value.length >= 10 && !/\s/.test(value)) return value;
  return '';
}
