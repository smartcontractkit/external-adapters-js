import { getCryptoPrice } from '@chainlink/data-engine-adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { AbiCoder, Contract, ethers, getAddress, keccak256 } from 'ethers'
import { PriceData, calculateMedianPrices, toNumFromDS } from './utils'

export type FeedAssetConfig = {
  symbol: string
  address: string
  providerKey?: string
}

export type FetchMedianPricesParams = {
  assets: FeedAssetConfig[]
  dataStoreContract: Contract
  dataRequestedTimestamp: number
  requester: Requester
  dataEngineUrl?: string
  sourceName?: string
  onError?: (assetKey: string, error: Error) => void
  onSuccess?: (assetKey: string) => void
}

type FetchPriceOptions = {
  requester: Requester
  dataEngineUrl?: string
  sourceName?: string
  onError?: (assetKey: string, error: Error) => void
  onSuccess?: (assetKey: string) => void
}

type FeedAssetWithId = {
  key: string
  feedId: string
  providerKey?: string
}

const abi = AbiCoder.defaultAbiCoder()
const DATA_STREAM_ID = keccak256(abi.encode(['string'], ['DATA_STREAM_ID']))

const hashData = (types: string[], values: unknown[]): string => {
  return keccak256(abi.encode(types, values))
}

export const dataStreamIdKey = (token: string): string => {
  return hashData(['bytes32', 'address'], [DATA_STREAM_ID, getAddress(token)])
}

type ResolveFeedIdParams = {
  dataStoreContract: ethers.Contract
  tokenAddress: string
  tokenSymbol: string
  dataRequestedTimestamp: number
}

const resolveFeedId = async ({
  dataStoreContract,
  tokenAddress,
  tokenSymbol,
  dataRequestedTimestamp,
}: ResolveFeedIdParams): Promise<string> => {
  const key = dataStreamIdKey(tokenAddress)
  try {
    const feedId = await dataStoreContract.getBytes32(key)
    if (feedId === ethers.ZeroHash) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Feed ID not set in datastore for token '${tokenSymbol}'`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
    return feedId
  } catch (error) {
    if (error instanceof AdapterDataProviderError) {
      throw error
    }
    const e = error as Error
    throw new AdapterDataProviderError(
      {
        statusCode: 502,
        message: `Unable to retrieve feed ID for ${tokenSymbol}: ${e.message}`,
      },
      {
        providerDataRequestedUnixMs: dataRequestedTimestamp,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    )
  }
}

export const fetchMedianPricesForAssets = async ({
  assets,
  dataStoreContract,
  dataRequestedTimestamp,
  requester,
  dataEngineUrl,
  sourceName,
  onError,
  onSuccess,
}: FetchMedianPricesParams) => {
  const feedAssets = await resolveFeeds(assets, dataStoreContract, dataRequestedTimestamp)
  const { priceData, priceProviders } = await fetchPriceData(feedAssets, {
    requester,
    dataEngineUrl,
    sourceName,
    onError,
    onSuccess,
  })

  const medianValues = calculateMedianPrices(
    assets.map((asset) => asset.symbol),
    priceData,
  )

  return { medianValues, priceProviders }
}

const resolveFeeds = async (
  assets: FeedAssetConfig[],
  dataStoreContract: Contract,
  dataRequestedTimestamp: number,
): Promise<FeedAssetWithId[]> => {
  return Promise.all(
    assets.map(async ({ symbol, address, providerKey }) => ({
      key: symbol,
      providerKey,
      feedId: await resolveFeedId({
        dataStoreContract,
        tokenAddress: address,
        tokenSymbol: symbol,
        dataRequestedTimestamp,
      }),
    })),
  )
}

const fetchPriceData = async (
  assets: FeedAssetWithId[],
  options: FetchPriceOptions,
): Promise<{ priceData: PriceData; priceProviders: Record<string, string[]> }> => {
  if (!options.dataEngineUrl) {
    throw new Error('DATA_ENGINE_ADAPTER_URL must be set')
  }

  const priceData: PriceData = {}
  const priceProviders: Record<string, string[]> = {}
  const failures = new Set<string>()
  const source = options.sourceName ?? 'data-engine'

  await Promise.all(
    assets.map(async ({ key, feedId, providerKey }) => {
      try {
        const { bid, ask, decimals } = await getCryptoPrice(
          feedId,
          options.dataEngineUrl!,
          options.requester,
        )
        const bidNum = toNumFromDS(bid, decimals)
        const askNum = toNumFromDS(ask, decimals)

        priceData[key] = priceData[key] || { bids: [], asks: [] }
        priceData[key].bids.push(bidNum)
        priceData[key].asks.push(askNum)

        const aggregatorKey = providerKey ?? key
        const existingProviders = priceProviders[aggregatorKey] || []
        if (!existingProviders.includes(source)) {
          priceProviders[aggregatorKey] = [...existingProviders, source]
        }
        options.onSuccess?.(key)
      } catch (error) {
        failures.add(key)
        options.onError?.(key, error as Error)
      }
    }),
  )

  if (failures.size) {
    throw new Error(`Missing responses for assets: ${Array.from(failures).join(', ')}`)
  }

  return { priceData, priceProviders }
}
