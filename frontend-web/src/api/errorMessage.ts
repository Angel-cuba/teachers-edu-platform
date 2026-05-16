import axios from 'axios'

/**
 * Extracts a human-readable message from an unknown error value.
 * Handles Axios errors (uses server response message when available),
 * standard Error instances, and unknown throws.
 */
export function extractErrorMessage(e: unknown, fallback = 'Error inesperado'): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as { message?: string })?.message ?? e.message ?? fallback
  }
  if (e instanceof Error) return e.message
  return fallback
}
