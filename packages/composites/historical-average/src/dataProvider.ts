import { AxiosRequestConfig, AdapterResponse } from '@chainlink/ea-bootstrap'
import { AdapterConfigError, AdapterInputError, Logger, Requester } from '@chainlink/ea-bootstrap'
import { adapter as cmc } from '@chainlink/coinmarketcap-adapter'
import { ResponseSchema } from '@chainlink/coinmarketcap-adapter/src/transport/historical'

export type ResponsePayload = {
  timestamp: Date
  price: number
}[]

export const getPriceProvider =
  (source: string, jobRunID: string, apiConfig: AxiosRequestConfig) =>
  async (
    base: string,
    quote: string,
    fromDate: Date,
    toDate: Date,
    interval: string,
  ): Promise<ResponsePayload> => {
    try {
      switch (source.toUpperCase()) {
        case cmc.name:
          return getCoinMarketCapPrice(jobRunID, base, quote, fromDate, toDate, interval, apiConfig)
      }
    } catch (error) {
      Logger.error(`Request to ${source} adapter failed: ${error}`)
      throw new AdapterConfigError({
        jobRunID,
        message: `Failed to request the ${source} adapter. Ensure that the ${source} adapter is working correctly & ${source.toUpperCase()}_ADAPTER_URL environment variable is correctly pointed to the adapter location.`,
      })
    }

    throw new AdapterInputError({
      jobRunID,
      message: `No historical data implementation for source ${source}!`,
    })
  }

const getCoinMarketCapPrice = async (
  jobRunID: string,
  base: string,
  quote: string,
  fromDate: Date,
  toDate: Date,
  interval: string,
  config: AxiosRequestConfig,
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
  const responseData = response.data as unknown as ResponseSchema
  return responseData.data.quotes.map((entry) => ({
    timestamp: new Date(entry.timestamp),
    price: entry.quote[quote.toUpperCase()].price,
  }))
}
