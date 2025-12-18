import { getCryptoPrice } from '@chainlink/data-engine-adapter'
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
import { GlvLwbaEndpointTypes } from '../endpoint/glv-lwba'
import { GlvPriceEndpointTypes } from '../endpoint/glv-price'
import { dataStreamIdKey } from './gmx-keys'
import {
  mapSymbol,
  Market,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  toFixed,
  Token,
  toNumFromDS,
} from './utils'

const logger = makeLogger('GmxTokensGlvBase')

interface GlvInformation {
  glvToken: string
  longToken: Token
  shortToken: Token
  markets: Record<string, Market>
}

export type GlvTransportParams<T extends GlvPriceEndpointTypes | GlvLwbaEndpointTypes> =
  TypeFromDefinition<T['Parameters']> & { glv: string }

export abstract class BaseGlvTransport<
  T extends GlvPriceEndpointTypes | GlvLwbaEndpointTypes,
> extends SubscriptionTransport<T> {
  abstract backgroundHandler(
    context: EndpointContext<T>,
    entries: GlvTransportParams<T>[],
  ): Promise<void>

  abstract handleRequest(param: GlvTransportParams<T>): Promise<void>

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

  name!: string
  responseCache!: ResponseCache<T>
  requester!: Requester
  provider!: ethers.JsonRpcProvider
  glvReaderContract!: ethers.Contract
  dataStoreContract!: ethers.Contract
  settings!: T['Settings']

  tokensMap: Record<string, Token> = {}
  marketsMap: Record<string, Market> = {}
  decimals: Record<string, number> = {}
  symbolToAddressMap: Record<string, string> = {}

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
    this.dataStoreContract = new ethers.Contract(
      adapterSettings.DATASTORE_CONTRACT_ADDRESS,
      ['function getBytes32(bytes32 key) view returns (bytes32)'],
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
      this.symbolToAddressMap[token.symbol] = token.address
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

  async _handleRequest(param: GlvTransportParams<T>): Promise<AdapterResponse<T['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const glv_address = param.glv

    const glvInfo = await this.glvReaderContract.getGlvInfo(
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      glv_address,
    )

    const glv: GlvInformation = {
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
      Array.from(glvInfo.markets),
      indexTokensPrices.map(([a, b]) => [a, b]),
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

  private async getFeedId(token: string, dataRequestedTimestamp: number): Promise<string> {
    const tokenAddress = this.symbolToAddressMap[token]
    if (!tokenAddress) {
      throw new AdapterDataProviderError(
        { statusCode: 400, message: `Unknown token symbol '${token}'` },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
    const key = dataStreamIdKey(tokenAddress)
    const feedId = await this.dataStoreContract.getBytes32(key)
    if (feedId === ethers.ZeroHash) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Feed ID not set in datastore for token '${token}'`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
    return feedId
  }

  private async fetchPrices(assets: string[], dataRequestedTimestamp: number) {
    const priceData = {} as PriceData

    const source = { url: this.settings.DATA_ENGINE_ADAPTER_URL, name: 'data-engine' }

    if (!source.url) {
      throw new Error('DATA_ENGINE_ADAPTER_URL must be set')
    }

    const priceProviders: Record<string, string[]> = {}
    await Promise.all(
      assets.map(async (asset) => {
        const feedId = await this.getFeedId(asset, dataRequestedTimestamp)

        try {
          const { bid, ask, decimals } = await getCryptoPrice(feedId, source.url!, this.requester)

          const bidNum = toNumFromDS(bid, decimals)
          const askNum = toNumFromDS(ask, decimals)
          priceData[asset] = priceData[asset] || { bids: [], asks: [] }
          priceData[asset].bids.push(bidNum)
          priceData[asset].asks.push(askNum)

          priceProviders[asset] = priceProviders[asset]
            ? [...new Set([...priceProviders[asset], source.name])]
            : [source.name]
        } catch (error) {
          const e = error as Error
          logger.error(
            `Error fetching data for ${asset} from ${source.name}, url - ${source.url}: ${e.message}`,
          )
        }
      }),
    )

    this.validateRequiredResponses(priceProviders, dataRequestedTimestamp)

    const medianValues = this.calculateMedian(assets, priceData)

    const prices: Record<string, Record<string, string | number>> = {}

    medianValues.forEach((v) => {
      if (this.decimals[v.asset as keyof typeof this.decimals] == null) {
        logger.error(`No decimals found for asset ${v.asset}`)
      }
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

  private validateRequiredResponses(
    priceProviders: Record<string, string[]> = {},
    dataRequestedTimestamp: number,
  ) {
    if (!Object.entries(priceProviders)?.length) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Missing responses from data-engine for all assets.`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
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
