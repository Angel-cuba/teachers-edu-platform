/**
 * Extracts the most descriptive error message from a backend API error.
 *
 * This project uses native fetch via lib/api.ts. The api layer already extracts
 * response.data.message and surfaces it as a plain Error: `throw new Error(msg)`.
 * So (err as Error).message already IS the backend message — no HTTP-client
 * library import needed.
 *
 * Falls back to `fallback` when err has no message (null, undefined, non-Error throws).
 *
 * Use this for backend API calls (lib/api.*) only.
 * For Clerk SDK errors use getClerkErrorMessage from ./clerkError.
 */
export function extractApiError(err: unknown, fallback = 'Unknown error'): string {
  return (err instanceof Error ? err.message : null) ?? fallback;
}
