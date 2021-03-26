import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { Config } from './config'

const cryptoCurrencies = ['BTC', 'ETH']

export const dominanceByCurrency = (
  response: Record<string, any>,
  quote: string,
): Record<string, number> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, payload } = response
  return Object.fromEntries(
    Object.entries(payload).map(([symbol, data]) => {
      const marketCap = (data as any).quote[quote].marketCap
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return [symbol, marketCap! / result]
    }),
  )
}

export const getDominanceByCurrency = async (jobRunID: number, config: Config, inputData: any) => {
  const allocations = cryptoCurrencies.map((symbol) => {
    return { symbol }
  })
  const quote = 'USD'
  const input: AdapterRequest = {
    id: '123',
    data: {
      allocations,
      quote,
    },
  }
  const dominanceData = await Requester.request({
    ...config.taConfig,
    data: {
      id: jobRunID,
      data: { ...inputData, allocations },
    },
  })
  return dominanceByCurrency(dominanceData.data, quote)
}
