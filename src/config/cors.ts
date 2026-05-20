type CorsOriginCallback = (error: Error | null, origin: boolean) => void;

export function isAllowedCorsOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (origin === undefined) {
    return true;
  }

  if (origin.trim().length === 0) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

export function createCorsOriginHandler(allowedOrigins: readonly string[]) {
  const allowedOriginSet = new Set(allowedOrigins);

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    if (origin === undefined) {
      callback(null, true);
      return;
    }

    if (origin.trim().length === 0) {
      callback(null, false);
      return;
    }

    callback(null, allowedOriginSet.has(origin));
  };
}
