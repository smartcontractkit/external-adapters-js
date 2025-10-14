export const wsMessageContent = (
  eventName: 'subscribe' | 'unsubscribe',
  apiKey: string,
  thresholdLevel: number,
  base: string,
  quote: string,
) => {
  const ticker = `${base}/${quote}`
  return {
    eventName,
    authorization: apiKey,
    eventData: {
      thresholdLevel,
      tickers: [ticker.toLowerCase()],
    },
  }
}
