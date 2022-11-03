// Placeholder. Will replace this when v3 framework is updated
export const validateResultNumber = (data: unknown, metric: string): number => {
  return (data as any).data[0][metric]
}
