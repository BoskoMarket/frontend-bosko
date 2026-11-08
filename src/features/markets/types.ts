/** A launch city (market). Defines country, currency and phone prefix of its users. */
export interface City {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2, e.g. "AR" | "CO". */
  countryCode: string;
  /** ISO 4217, e.g. "ARS" | "COP". */
  currency: string;
  /** International prefix including "+", e.g. "+54". */
  phonePrefix: string;
}

/** City summary carried by the profile (`GET /users/me`). Absent on older backends. */
export interface UserCity {
  id: string;
  name: string;
  currency: string;
}
