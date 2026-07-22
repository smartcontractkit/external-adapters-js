import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/midas'
import { getAnchorData } from '../shared/anchor-data'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('MidasTransport')

const RESULT_DECIMALS = 18
const SOLANA_DECIMALS = 9

type RequestParams = typeof inputParameters.validated

const FeedStateFields = {
  minPrice: 'min_price',
  maxPrice: 'max_price',
  maxStaleness: 'max_staleness',
  underlyingFeed: 'underlying_feed',
} as const

const ManualFeedStateFields = {
  price: 'price',
  decimals: 'decimals',
  lastUpdatedAt: 'last_updated_at',
} as const

export class MidasTransport extends SubscriptionTransport<BaseEndpointTypes> {
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const feedStateData = await getAnchorData({
      rpc: this.rpc,
      stateAccountAddress: params.feedStateAddress,
      account: 'FeedState',
      fields: Object.values(FeedStateFields),
    })

    const manualFeedStateAccount = feedStateData[FeedStateFields.underlyingFeed].toString()

    const manualFeedStateData = await getAnchorData({
      rpc: this.rpc,
      stateAccountAddress: manualFeedStateAccount,
      account: 'ManualFeedState',
      fields: Object.values(ManualFeedStateFields),
    })

    let lastUpdatedAt = Number(manualFeedStateData[ManualFeedStateFields.lastUpdatedAt])
    const maxStaleness = Number(feedStateData[FeedStateFields.maxStaleness])

    let secondsSinceLastUpdate = Math.floor(Date.now() / 1000) - lastUpdatedAt

    let ripcord: 0 | 1 = 0

    if (secondsSinceLastUpdate > maxStaleness) {
      ripcord = 1
    }

    const rawPrice = BigInt(manualFeedStateData[ManualFeedStateFields.price])
    const rawPriceDecimals = Number(manualFeedStateData[ManualFeedStateFields.decimals])
    const minPrice = BigInt(feedStateData[FeedStateFields.minPrice])
    const maxPrice = BigInt(feedStateData[FeedStateFields.maxPrice])

    const scaledRawPrice =
      (rawPrice * 10n ** BigInt(RESULT_DECIMALS)) / 10n ** BigInt(rawPriceDecimals)
    const scaledMinPrice =
      (minPrice * 10n ** BigInt(RESULT_DECIMALS)) / 10n ** BigInt(SOLANA_DECIMALS)
    const scaledMaxPrice =
      (maxPrice * 10n ** BigInt(RESULT_DECIMALS)) / 10n ** BigInt(SOLANA_DECIMALS)

    let result: string

    if (scaledRawPrice < scaledMinPrice || scaledRawPrice > scaledMaxPrice) {
      const outOfBoundsMessage = `Price ${
        Number(rawPrice) / 10 ** rawPriceDecimals
      } is out of bounds [${Number(minPrice) / 10 ** SOLANA_DECIMALS}, ${
        Number(maxPrice) / 10 ** SOLANA_DECIMALS
      }]`
      logger.info(`${outOfBoundsMessage}. Getting price from cache.`)
      const cacheKey = this.responseCache.getCacheKey(this.name, params)
      const cachedResponse = await this.responseCache.get(cacheKey)

      if (!cachedResponse?.result) {
        throw new AdapterInputError({
          message: `${outOfBoundsMessage} and no cached price is available.`,
          statusCode: 502,
        })
      }

      result = cachedResponse.result
      lastUpdatedAt = cachedResponse.data.lastUpdatedAt
      secondsSinceLastUpdate = Math.floor(Date.now() / 1000) - lastUpdatedAt
      ripcord = 1
    } else {
      result = scaledRawPrice.toString()
    }

    return {
      data: {
        result,
        decimals: RESULT_DECIMALS,
        price: Number(result) / 10 ** RESULT_DECIMALS,
        rawPrice: scaledRawPrice.toString(),
        minPrice: Number(minPrice) / 10 ** SOLANA_DECIMALS,
        maxPrice: Number(maxPrice) / 10 ** SOLANA_DECIMALS,
        lastUpdatedAt,
        secondsSinceLastUpdate,
        maxStaleness,
        ripcord,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const midasTransport = new MidasTransport()
