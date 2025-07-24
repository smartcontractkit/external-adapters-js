export const wsMessageContent = (
  eventName: 'subscribe' | 'unsubscribe',
  apiKey: string,
  thresholdLevel: number,
  base: string,
  quote: string,
) => {
  return {
    eventName,
    authorization: apiKey,
    eventData: {
      thresholdLevel,
      tickers: [`${base}/${quote}`.toLowerCase()],
    },
  }
}
