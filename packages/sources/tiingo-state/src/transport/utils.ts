export const wsMessageContent = (
  eventName: 'subscribe' | 'unsubscribe',
  apiKey: string,
  thresholdLevel: number,
  base: string,
  quote: string,
  skipSlash = false,
) => {
  const ticker = skipSlash ? `${base}${quote}` : `${base}/${quote}`
  return {
    eventName,
    authorization: apiKey,
    eventData: {
      thresholdLevel,
      tickers: [ticker.toLowerCase()],
    },
  }
}
