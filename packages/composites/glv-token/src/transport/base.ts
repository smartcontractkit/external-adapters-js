import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import glvAbi from '../config/glvReaderAbi.json'
import { DataStreamsHttpClient } from '../datastreams/client'
import { decodeReport } from '../datastreams/decode'
import { BaseEndpointTypesLwba } from '../endpoint/lwba'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import {
  mapSymbol,
  Market,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  Source,
  toFixed,
  Token,
} from './utils'

const logger = makeLogger('GlvBaseTransport')

interface glvInformation {
  glvToken: string
  longToken: Token
  shortToken: Token
  markets: Record<string, Market>
}

type RequestParams = typeof inputParameters.validated

/**
 * The base class contains all logic that is shared across both
 * 'price' and 'lwba' variants. The child transports will override
 * `formatResponse()` to produce different output shapes.
 */
export abstract class BaseGlvTransport<
  T extends BaseEndpointTypes | BaseEndpointTypesLwba,
> extends SubscriptionTransport<T> {
  abstract backgroundHandler(
    context: EndpointContext<T>,
    entries: TypeFromDefinition<T['Parameters']>[],
  ): Promise<void>

  abstract handleRequest(param: TypeFromDefinition<T['Parameters']>): Promise<void>

  name!: string
  responseCache!: ResponseCache<T>
  requester!: Requester
  provider!: ethers.JsonRpcProvider
  glvReaderContract!: ethers.Contract
  settings!: T['Settings']
  dataStreamsClient!: DataStreamsHttpClient
  tokensMap: Record<string, Token> = {}
  marketsMap: Record<string, Market> = {}
  decimals: Record<string, number> = {}

  async initialize(
    dependencies: TransportDependencies<T>,
    adapterSettings: T['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ARBITRUM_RPC_URL,
      adapterSettings.ARBITRUM_CHAIN_ID,
    )
    this.requester = dependencies.requester

    this.glvReaderContract = new ethers.Contract(
      adapterSettings.GLV_READER_CONTRACT_ADDRESS,
      glvAbi,
      this.provider,
    )

    await this.tokenInfo()
    await this.marketInfo()

    this.dataStreamsClient = new DataStreamsHttpClient({
      baseUrl: adapterSettings.DATA_ENGINE_BASE_URL,
      userId: adapterSettings.DATA_ENGINE_USER_ID,
      userSecret: adapterSettings.DATA_ENGINE_USER_SECRET,
      timeoutMs: adapterSettings.GLV_INFO_API_TIMEOUT_MS,
      requester: dependencies.requester,
    })
    if (this.settings.METADATA_REFRESH_INTERVAL_MS > 0) {
      setInterval(() => {
        this.tokenInfo()
        this.marketInfo()
      }, this.settings.METADATA_REFRESH_INTERVAL_MS)
    }
  }

  protected abstract formatResponse(
    result: number,
    minimizedValue: number,
    maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: {
      providerDataRequestedUnixMs: number
      providerDataReceivedUnixMs: number
      providerIndicatedTimeUnixMs: undefined
    },
  ): AdapterResponse<T['Response']>

  async tokenInfo() {
    const requestConfig = {
      url: this.settings.TOKEN_INFO_API,
      method: 'GET',
      timeout: this.settings.GLV_INFO_API_TIMEOUT_MS,
    }

    logger.info('Fetching token info')
    const response = await this.requester.request<{ tokens: Token[] }>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    const data: Token[] = response.response.data.tokens
    data.map((token) => {
      this.tokensMap[token.address] = token
      this.decimals[token.symbol] = token.decimals
    })
  }

  async marketInfo() {
    const requestConfig = {
      url: this.settings.MARKET_INFO_API,
      method: 'GET',
      timeout: this.settings.GLV_INFO_API_TIMEOUT_MS,
    }

    logger.info('Fetching market info')
    const response = await this.requester.request<{ markets: Market[] }>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    const data: Market[] = response.response.data.markets
    data.map((market) => {
      this.marketsMap[market.marketToken] = market
    })
  }

  async _handleRequest(param: RequestParams): Promise<AdapterResponse<T['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const glv_address = param.glv

    const glvInfo = await this.glvReaderContract.getGlvInfo(
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      glv_address,
    )

    const glv: glvInformation = {
      glvToken: glvInfo.glv.glvToken,
      longToken: mapSymbol(glvInfo.glv.longToken, this.tokensMap),
      shortToken: mapSymbol(glvInfo.glv.shortToken, this.tokensMap),
      markets: {},
    }

    for (let i = 0; i < glvInfo.markets.length; i++) {
      glv.markets[glvInfo.markets[i]] = mapSymbol(glvInfo.markets[i], this.marketsMap)
    }

    const assets: Array<string> = [glv.longToken.symbol, glv.shortToken.symbol]
    Object.keys(glv.markets).forEach((m) => {
      assets.push(mapSymbol(glv.markets[m].indexToken, this.tokensMap).symbol)
    })

    assets.sort()
    const priceResult = await this.fetchPrices([...new Set(assets)], providerDataRequestedUnixMs)

    const indexTokensPrices: Array<string | number>[] = []
    Object.keys(glv.markets).forEach((m) => {
      const symbol = mapSymbol(glv.markets[m].indexToken, this.tokensMap).symbol
      indexTokensPrices.push([priceResult.prices[symbol].bid, priceResult.prices[symbol].ask])
    })

    const glvTokenPriceContractParams = [
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      glvInfo.markets,
      indexTokensPrices,
      [priceResult.prices[glv.longToken.symbol].bid, priceResult.prices[glv.longToken.symbol].ask],
      [
        priceResult.prices[glv.shortToken.symbol].bid,
        priceResult.prices[glv.shortToken.symbol].ask,
      ],
      glv_address,
    ]

    const [[maximizedPriceRaw], [minimizedPriceRaw]] = await Promise.all([
      this.glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, true),
      this.glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(ethers.formatUnits(maximizedPriceRaw, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(ethers.formatUnits(minimizedPriceRaw, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    return this.formatResponse(
      result,
      minimizedPrice,
      maximizedPrice,
      priceResult.sources,
      timestamps,
    )
  }

  private async fetchPrices(assets: string[], dataRequestedTimestamp: number) {
    const priceData = {} as PriceData

    const priceProviders: Record<string, string[]> = {}
    const sources: Source[] = [{ name: 'data-streams', url: this.settings.DATA_ENGINE_BASE_URL }]

    await Promise.all(
      assets.map(async (asset) => {
        const base = this.unwrapAsset(asset)
        const feedId = await this.dataStreamsClient.resolveFeedId(base, 'USD', 'Crypto')
        const { fullReportHex } = await this.dataStreamsClient.getLatestReport(feedId)

        // Decode (V3 expected: price, bid, ask; decoder handles V2–V10)
        const decoded = decodeReport(fullReportHex, feedId)
        const scale = 10 ** SIGNED_PRICE_DECIMALS
        const toNum = (x: any | undefined) => (x === undefined ? undefined : Number(x) / scale)

        const v3Bid = (decoded as any).bid
        const v3Ask = (decoded as any).ask
        const v3Price = (decoded as any).price

        const bidNum = toNum(v3Bid ?? v3Price)
        const askNum = toNum(v3Ask ?? v3Price)

        if (bidNum === undefined || askNum === undefined) {
          throw new AdapterDataProviderError(
            { statusCode: 502, message: `Could not decode bid/ask for ${asset}` },
            {
              providerDataRequestedUnixMs: dataRequestedTimestamp,
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          )
        }

        // Store raw numbers for median calc
        priceData[asset] = {
          bids: [...(priceData[asset]?.bids || []), bidNum],
          asks: [...(priceData[asset]?.asks || []), askNum],
        }

        // Track that Data Streams responded for this *base* key
        priceProviders[base] = priceProviders[base] ? priceProviders[base] : []
        if (!priceProviders[base].includes(sources[0].name)) {
          priceProviders[base].push(sources[0].name)
        }
      }),
    )

    this.validateRequiredResponses(priceProviders, sources, assets, dataRequestedTimestamp)

    const medianValues = this.calculateMedian(assets, priceData)
    const prices: Record<string, Record<string, string | number>> = {}

    medianValues.forEach((v) => {
      prices[v.asset] = {
        ...v,
        ask: toFixed(v.ask, this.decimals[v.asset as keyof typeof this.decimals]),
        bid: toFixed(v.bid, this.decimals[v.asset as keyof typeof this.decimals]),
      }
    })

    return {
      prices,
      sources: priceProviders,
    }
  }

  private calculateMedian(assets: string[], priceData: PriceData) {
    return assets.map((asset) => {
      const medianBid = median([...new Set(priceData[asset].bids)])
      const medianAsk = median([...new Set(priceData[asset].asks)])
      return { asset, bid: medianBid, ask: medianAsk }
    })
  }

  private unwrapAsset(asset: string) {
    if (asset === 'WBTC.b') {
      return 'BTC'
    }
    if (asset === 'WETH') {
      return 'ETH'
    }
    return asset
  }

  private validateRequiredResponses(
    priceProviders: Record<string, string[]> = {},
    sources: Source[],
    assets: string[],
    dataRequestedTimestamp: number,
  ) {
    const allSource = sources.map((s) => s.name)
    if (!Object.entries(priceProviders)?.length) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Missing responses from '${allSource.join(',')}' for all assets.`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    assets.forEach((asset) => {
      const base = this.unwrapAsset(asset)
      const respondedSources = priceProviders[base]

      if (respondedSources.length < this.settings.MIN_REQUIRED_SOURCE_SUCCESS) {
        const missingSources = allSource.filter((s) => !respondedSources.includes(s))
        logger.error(`Missing responses from '${missingSources.join(',')}' for asset: ${asset}`)
        throw new AdapterDataProviderError(
          {
            statusCode: 502,
            message: `Cannot calculate median price for '${asset}'. At least ${
              this.settings.MIN_REQUIRED_SOURCE_SUCCESS
            } EAs are required to provide a response but response was received only from ${
              respondedSources.length
            } EA(s). Missing responses from '${missingSources.join(',')}'.`,
          },
          {
            providerDataRequestedUnixMs: dataRequestedTimestamp,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        )
      }
    })
  }

  protected handleError(e: unknown): AdapterResponse<T['Response']> {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
    logger.error(e, errorMessage)
    return {
      statusCode: 502,
      errorMessage,
      timestamps: {
        providerDataRequestedUnixMs: 0,
        providerDataReceivedUnixMs: 0,
        providerIndicatedTimeUnixMs: undefined,
      },
    } as AdapterResponse<T['Response']>
  }

  getSubscriptionTtlFromConfig(adapterSettings: T['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}
