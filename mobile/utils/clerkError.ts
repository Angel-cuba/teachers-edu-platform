type ClerkErrorLike = {
  errors?: Array<{ longMessage?: string; message?: string }>;
};

/**
 * Extracts the most descriptive error message from a Clerk API error.
 * Prefers `longMessage` over `message`, falls back to the provided fallback string.
 */
export function getClerkErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  const e = err as ClerkErrorLike;
  return (
    e?.errors?.[0]?.longMessage ??
    e?.errors?.[0]?.message ??
    (err as Error)?.message ??
    fallback
  );
}
