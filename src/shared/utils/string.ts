export const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const includes = (haystack: string, needle: string) =>
  normalize(haystack).includes(normalize(needle));
