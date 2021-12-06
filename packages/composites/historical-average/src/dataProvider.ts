import { RequestConfig, AdapterResponse } from '@chainlink/types'
import { Logger, Requester } from '@chainlink/ea-bootstrap'
import * as cmc from '@chainlink/coinmarketcap-adapter'

export type ResponsePayload = {
  timestamp: Date
  price: number
}[]

export const getPriceProvider =
  (source: string, jobRunID: string, apiConfig: RequestConfig) =>
  async (
    base: string,
    quote: string,
    fromDate: Date,
    toDate: Date,
    interval: string,
  ): Promise<ResponsePayload> => {
    try {
      switch (source.toUpperCase()) {
        case cmc.NAME:
          return getCoinMarketCapPrice(jobRunID, base, quote, fromDate, toDate, interval, apiConfig)
      }
    } catch (error) {
      Logger.error(`Request to ${source} adapter failed: ${error}`)
      throw new Error(
        `Failed to request the ${source} adapter. Ensure that the ${source.toUpperCase()}_ADAPTER_URL environment variable is correctly pointed to the adapter location.`,
      )
    }

    throw new Error(`No historical data implementation for source ${source}!`)
  }

const getCoinMarketCapPrice = async (
  jobRunID: string,
  base: string,
  quote: string,
  fromDate: Date,
  toDate: Date,
  interval: string,
  config: RequestConfig,
): Promise<ResponsePayload> => {
  const data = {
    id: jobRunID,
    data: {
      endpoint: 'historical',
      base,
      quote,
      start: fromDate.toISOString(),
      end: toDate.toISOString(),
      interval,
      // Specifying count is not necessary since we have provided a [start, end] interval
    },
  }
  const response = await Requester.request<AdapterResponse>({ ...config, data })
  const responseData = response.data.data as cmc.types.historical.ResponseSchema
  return responseData.data.quotes.map((entry) => ({
    timestamp: new Date(entry.timestamp),
    price: entry.quote[quote.toUpperCase()].price,
  }))
}
