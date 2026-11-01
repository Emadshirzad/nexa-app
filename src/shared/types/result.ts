/**
 * Represents the outcome of an operation: either a success (Ok) with data T,
 * or a failure (Fail) with error E.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T; readonly error?: never }
  | { readonly success: false; readonly error: E; readonly data?: never };

export const ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data
});

export const fail = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error
});

export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success;
};

export const isFail = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};
