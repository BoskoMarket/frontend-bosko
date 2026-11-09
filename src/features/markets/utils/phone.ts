import type { City } from '../types';

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina',
  CO: 'Colombia',
};

export function countryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] ?? countryCode;
}

export function findCity(cities: readonly City[] | undefined, cityId: string | undefined | null): City | undefined {
  if (!cities || !cityId) return undefined;
  return cities.find((city) => city.id === cityId);
}

/** Helper text under the phone field, e.g. "Debe ser un número de Argentina (+54)". */
export function phonePrefixHint(city: City | undefined): string | null {
  if (!city) return null;
  return `Debe ser un número de ${countryName(city.countryCode)} (${city.phonePrefix})`;
}

/** Message for `PHONE_COUNTRY_MISMATCH`: specific when the city is known, neutral otherwise. */
export function phoneCountryMismatchMessage(city: City | undefined): string {
  if (!city) return 'El teléfono no corresponde al país de tu ciudad';
  return `El teléfono debe ser de ${countryName(city.countryCode)} (${city.phonePrefix})`;
}

/** True when a normalized E.164 number starts with the city's prefix. */
export function phoneMatchesCity(normalizedPhone: string, city: City | undefined): boolean {
  if (!city) return true;
  return normalizedPhone.startsWith(city.phonePrefix);
}
