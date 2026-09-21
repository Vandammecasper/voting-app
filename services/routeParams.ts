export function firstSearchParam(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.length > 0);
    return typeof first === 'string' ? first : undefined;
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return undefined;
}
