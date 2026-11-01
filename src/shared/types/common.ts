export type UUID = string;
export type ISO8601String = string; // e.g. 2026-11-02T02:00:00Z
export type ISODateString = string;  // e.g. 2026-11-02
export type JalaliDateString = string; // e.g. 1405/08/11

/**
 * Scaled integer representation.
 * For currency: Integer Toman (1 Toman = 1)
 * For stock: Integer scaled by 1,000 (1.250 kg = 1250)
 */
export type Toman = number;
export type ScaledStock = number;

export type Nullable<T> = T | null;
