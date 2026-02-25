/**
 * Formate une date au format dd/mm/yy (ex: 25/02/26)
 * Utilisé uniformément dans toute l'app
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

/**
 * Formate une date avec l'heure : dd/mm/yy à hh:mm (ex: 25/02/26 à 14:30)
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const datePart = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const timePart = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} à ${timePart}`;
}
