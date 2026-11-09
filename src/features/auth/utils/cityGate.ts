/**
 * `null` = the API says the account has no city yet; `undefined` = the backend does not
 * send the field (old backend) or the profile is unknown. Only `null` triggers the gate.
 */
export function needsCity(city: unknown): boolean {
  return city === null;
}

export const SELECT_CITY_HREF = '/auth/select-city';
