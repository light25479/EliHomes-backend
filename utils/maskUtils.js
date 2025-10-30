// utils/maskUtils.js
export function maskAccountNumber(number) {
  if (!number) return '';
  const str = number.toString();
  const last4 = str.slice(-4);
  return str.length > 4 ? '**** **** ' + last4 : '**** ' + last4;
}
