const randomPart = () => Math.random().toString(36).slice(2, 10);

/**
 * Generates an ID that works across older mobile browsers/webviews where
 * crypto.randomUUID may be missing.
 */
export const createId = (prefix = ""): string => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return `${prefix}${cryptoApi.randomUUID()}`;
  }

  return `${prefix}${Date.now().toString(36)}_${randomPart()}${randomPart()}`;
};
