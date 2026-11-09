/**
 * wa.me link for the support chat. Returns `null` when there is no usable number so
 * callers can hide the contact action instead of opening a broken link.
 */
export function buildWhatsappUrl(number?: string | null, message?: string | null): string | null {
  const digits = (number ?? '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const text = (message ?? '').trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
