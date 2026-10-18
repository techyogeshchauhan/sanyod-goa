import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/api/client';

/**
 * Maps an API error onto the form: field errors go to their inputs, and the returned
 * message is shown in the page's alert box (like the PHP pages' $error).
 */
export function applyApiError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): string {
  if (err instanceof ApiError) {
    if (err.fields) {
      for (const [field, message] of Object.entries(err.fields)) {
        setError(field as Path<T>, { type: 'server', message });
      }
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}
