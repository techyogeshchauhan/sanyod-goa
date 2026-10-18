/** Small inline error under a field (only rendered when there is an error). */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="invalid-feedback d-block">{message}</div>;
}
