import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { ethers, utils } from 'ethers'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  EndpointContext,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import {
  toFixed,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  Source,
  getTokenInfo,
  getMarketsInfo,
  Token,
  Market,
  mapSymbol,
  glvMarkets,
} from './utils'
import abi from '../config/readerAbi.json'
import glvAbi from '../config/glvReaderAbi.json'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('GlvToken')

type RequestParams = typeof inputParameters.validated

export type GlvTokenTransportTypes = BaseEndpointTypes

interface glvInformation {
  glvToken: string
  longToken: Token
  shortToken: Token
  markets: Record<string, Market>
}

export class GlvTokenTransport extends SubscriptionTransport<GlvTokenTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GlvTokenTransportTypes>
  requester!: Requester
  provider!: ethers.providers.JsonRpcProvide
  readerContract!: ethers.Contract
  glvReaderContract!: ethers.Contract
  abiEncoder!: utils.AbiCoder
  settings!: GlvTokenTransportTypes['Settings']

  tokensMap!: Record<string, Token>
  marketsMap!: Record<string, Market>
  decimals!: Record<string, number>

  async initialize(
    dependencies: TransportDependencies<GlvTokenTransportTypes>,
    adapterSettings: GlvTokenTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.provider = ethers.providers.JsonRpcProvider(
      adapterSettings.ARBITRUM_RPC_URL,
      adapterSettings.ARBITRUM_CHAIN_ID,
    )
    this.readerContract = new ethers.Contract(
      adapterSettings.READER_CONTRACT_ADDRESS,
      abi,
      this.provider,
    )
    this.requester = dependencies.requester

    this.glvReaderContract = new ethers.Contract(
      adapterSettings.GLV_READER_CONTRACT_ADDRESS,
      glvAbi,
      this.provider,
    )

    const { token_info: tokensMap, decimals_info: decimals } = await getTokenInfo()

    this.tokensMap = tokensMap
    this.decimals = decimals
    this.marketsMap = await getMarketsInfo()
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: 502,
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
    param: RequestParams,
  ): Promise<AdapterResponse<GlvTokenTransportTypes['Response']>> {
    const glv_address = param.glv

    const glvInfo = await this.glvReaderContract.getGlvInfo(
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      glv_address,
    )

    const glv: glvInformation = {
      glvToken: mapSymbol(glvInfo.glv.glvToken, glvMarkets),
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
    const providerDataRequestedUnixMs = Date.now()
    const priceResult = await this.fetchPrices([...new Set(assets)], providerDataRequestedUnixMs)

    const indexTokensPrices: Array<string | number>[] = []
    Object.keys(glv.markets).forEach((m) => {
      const symbol = mapSymbol(glv.markets[m].indexToken, this.tokensMap).symbol
      indexTokensPrices.push([priceResult.prices[symbol].ask, priceResult.prices[symbol].bid])
    })

    const glvTokenPriceContractParams = [
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      glvInfo.markets,
      indexTokensPrices,
      [priceResult.prices[glv.longToken.symbol].ask, priceResult.prices[glv.longToken.symbol].bid],
      [
        priceResult.prices[glv.shortToken.symbol].ask,
        priceResult.prices[glv.shortToken.symbol].bid,
      ],
      glv_address,
    ]

    // Prices have a spread from min to max. The last param (maximize-true/false) decides whether to maximize the market token price
    // or not. We get both values and return the median.
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      this.glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, true),
      this.glvReaderContract.getGlvTokenPrice(...glvTokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(utils.formatUnits(maximizedValue, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(utils.formatUnits(minimizedValue, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    return {
      data: {
        result: result,
        sources: priceResult.sources,
      },
      statusCode: 200,
      result: result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  // Fetches the lwba price info from multiple source EAs, calculates the median for bids and asks per asset and fixes the price precision
  private async fetchPrices(assets: string[], dataRequestedTimestamp: number) {
    // priceData holds raw bid/ask values per asset from source EAs response
    const priceData = {} as PriceData

    const sources = [
      { url: this.settings.TIINGO_ADAPTER_URL, name: 'tiingo' },
      { url: this.settings.COINMETRICS_ADAPTER_URL, name: 'coinmetrics' },
      { url: this.settings.NCFX_ADAPTER_URL, name: 'ncfx' },
    ]

    //priceProviders contains assets with a list of sources where asset price was successfully fetched
    const priceProviders: Record<string, string[]> = {}

    const promises = []

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]

      const assetPromises = assets.map(async (asset) => {
        const base = this.unwrapAsset(asset)
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

        // try/catch is needed in a case if one of source EAs fails to return a response,
        // we will still get and calculate the median price based on responses of remaining EAs (based on MIN_REQUIRED_SOURCE_SUCCESS setting)
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

          priceProviders[base] = priceProviders[base]
            ? [...new Set([...priceProviders[base], source.name])]
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
      // Since most of the gm markets have the same long and index tokens, we need to remove duplicate values from duplicate requests
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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const glvTokenTransport = new GlvTokenTransport()
