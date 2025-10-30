// utils/formatPhone.js
export function formatPhone(phone) {
  if (!phone) return '';

  // Remove any non-digit characters (spaces, dashes, etc.)
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    // Local Kenyan number: 0712345678 → 254712345678
    return '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already correct
    return cleaned;
  } else {
    // Invalid format
    return '';
  }
}
