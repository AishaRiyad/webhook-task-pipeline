export function calculateRetryDelaySeconds(attemptNumber: number): number {
  return Math.min(2 ** attemptNumber * 5, 300);
}

export function calculateNextRetry(attemptNumber: number): Date {
  const delayInSeconds = calculateRetryDelaySeconds(attemptNumber);
  return new Date(Date.now() + delayInSeconds * 1000);
}