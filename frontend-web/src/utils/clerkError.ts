type ClerkErrorLike = {
  errors?: Array<{ longMessage?: string; message?: string }>;
};

/**
 * Extracts the most descriptive error message from a Clerk API error.
 * Prefers `longMessage` over `message` (Clerk shapes), then falls back to the
 * plain JS Error `.message` (non-Clerk throws), then to `fallback`.
 *
 * NOTE: use this for Clerk SDK calls only.
 * For Axios/API errors use `extractErrorMessage` from `../api/errorMessage`.
 */
export function getClerkErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  const e = err as ClerkErrorLike;
  return (
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    (err as Error)?.message ??
    fallback
  );
}
