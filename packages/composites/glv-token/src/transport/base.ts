import { ethers, utils } from 'ethers'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  EndpointContext,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import glvAbi from '../config/glvReaderAbi.json'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { BaseEndpointTypesLwba } from '../endpoint/lwba'
import {
  mapParameter,
  mapSymbol,
  Market,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  Source,
  toFixed,
  Token,
} from './utils'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

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
  provider!: ethers.providers.JsonRpcProvider
  glvReaderContract!: ethers.Contract
  settings!: T['Settings']

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
    this.provider = new ethers.providers.JsonRpcProvider(
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

    const maximizedPrice = Number(utils.formatUnits(maximizedPriceRaw, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(utils.formatUnits(minimizedPriceRaw, SIGNED_PRICE_DECIMALS))
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

    const sources = [
      { url: this.settings.TIINGO_ADAPTER_URL, name: 'tiingo' },
      { url: this.settings.COINMETRICS_ADAPTER_URL, name: 'coinmetrics' },
      { url: this.settings.NCFX_ADAPTER_URL, name: 'ncfx' },
    ]

    const priceProviders: Record<string, string[]> = {}
    const promises = []

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      const assetPromises = assets.map(async (asset) => {
        const mappedAsset = mapParameter(source.name, asset)
        const base = this.unwrapAsset(mappedAsset)
        const requestConfig = {
          url: source.url,
          method: 'POST',
          data: {
            data: {
              endpoint: 'crypto-lwba',
              base,
              quote: 'USD',
            },
          },
        }

        try {
          const response = await this.requester.request<{ data: LwbaResponseDataFields['Data'] }>(
            JSON.stringify(requestConfig),
            requestConfig,
          )
          const { bid, ask } = response.response.data.data

          priceData[asset] = {
            bids: [...(priceData[asset]?.bids || []), bid],
            asks: [...(priceData[asset]?.asks || []), ask],
          }

          priceProviders[asset] = priceProviders[asset]
            ? [...new Set([...priceProviders[asset], source.name])]
            : [source.name]
        } catch (error) {
          const e = error as Error
          logger.error(
            `Error fetching data for ${asset} from ${source.name}, url - ${source.url}: ${e.message}`,
          )
        }
      })

      promises.push(...assetPromises)
    }

    await Promise.all(promises)

    this.validateRequiredResponses(priceProviders, sources, assets, dataRequestedTimestamp)

    const medianValues = this.calculateMedian(assets, priceData)

    const prices: Record<string, Record<string, string | number>> = {}

    medianValues.map(
      (v) =>
        (prices[v.asset] = {
          ...v,
          ask: toFixed(v.ask, this.decimals[v.asset as keyof typeof this.decimals]),
          bid: toFixed(v.bid, this.decimals[v.asset as keyof typeof this.decimals]),
        }),
    )

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
