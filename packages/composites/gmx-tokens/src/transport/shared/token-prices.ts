import { getCryptoPrice } from '@chainlink/data-engine-adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { PriceData, toNumFromDS } from './utils'

export interface FetchTokenPricesParams {
  assets: Array<{
    key: string
    feedId: string
    providerKey?: string
  }>
  requester: Requester
  dataEngineUrl?: string
  sourceName?: string
  onError?: (assetKey: string, error: Error) => void
  onSuccess?: (assetKey: string) => void
}

export interface TokenPricesResponse {
  priceData: PriceData
  priceProviders: Record<string, string[]>
}

export const fetchTokenPrices = async ({
  assets,
  requester,
  dataEngineUrl,
  sourceName = 'data-engine',
  onError,
  onSuccess,
}: FetchTokenPricesParams): Promise<TokenPricesResponse> => {
  if (!dataEngineUrl) {
    throw new Error('DATA_ENGINE_ADAPTER_URL must be set')
  }

  const priceData: PriceData = {}
  const priceProviders: Record<string, string[]> = {}
  const failures = new Set<string>()

  await Promise.allSettled(
    assets.map(async ({ key, feedId, providerKey }) => {
      try {
        const { bid, ask, decimals } = await getCryptoPrice(feedId, dataEngineUrl, requester)
        const bidNum = toNumFromDS(bid, decimals)
        const askNum = toNumFromDS(ask, decimals)

        priceData[key] = priceData[key] || { bids: [], asks: [] }
        priceData[key].bids.push(bidNum)
        priceData[key].asks.push(askNum)

        const aggregatorKey = providerKey ?? key
        const existingProviders = priceProviders[aggregatorKey] || []
        if (!existingProviders.includes(sourceName)) {
          priceProviders[aggregatorKey] = [...existingProviders, sourceName]
        }
        onSuccess?.(key)
      } catch (error) {
        failures.add(key)
        onError?.(key, error as Error)
      }
    }),
  )

  if (failures.size) {
    throw new Error(`Missing responses for assets: ${Array.from(failures).join(', ')}`)
  }

  return { priceData, priceProviders }
}
