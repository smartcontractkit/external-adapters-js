import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import {
  EndpointContext,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers, utils } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import abi from './../config/readerAbi.json'
import { TokenMeta, TokenResolver } from './token-resolver'
import { median, PriceData, SIGNED_PRICE_DECIMALS, Source, toFixed } from './utils'

const logger = makeLogger('GMToken')

type RequestParams = typeof inputParameters.validated

export type GmTokenTransportTypes = BaseEndpointTypes

type ChainKey = 'arbitrum' | 'botanix'

export class GmTokenTransport extends SubscriptionTransport<GmTokenTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTokenTransportTypes>
  requester!: Requester
  abiEncoder!: utils.AbiCoder
  settings!: GmTokenTransportTypes['Settings']
  tokenResolver!: TokenResolver
  private providers: Partial<Record<ChainKey, ethers.providers.JsonRpcProvider>> = {}
  private readers: Partial<Record<ChainKey, ethers.Contract>> = {}

  async initialize(
    dependencies: TransportDependencies<GmTokenTransportTypes>,
    adapterSettings: GmTokenTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.tokenResolver = new TokenResolver(this.requester, this.settings)
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
  ): Promise<AdapterResponse<GmTokenTransportTypes['Response']>> {
    const { index, long, short, market, chain } = param

    const assets = [index, long, short]

    const providerDataRequestedUnixMs = Date.now()

    const [indexToken, longToken, shortToken] = await Promise.all([
      this.resolveTokenMeta(chain, index),
      this.resolveTokenMeta(chain, long),
      this.resolveTokenMeta(chain, short),
    ])
    const decimalsMap = new Map(
      [indexToken, longToken, shortToken].map((t) => [t.symbol, t.decimals]),
    )

    const {
      prices: [indexPrices, longPrices, shortPrices],
      sources,
    } = await this.fetchPrices(assets, providerDataRequestedUnixMs, decimalsMap)

    const tokenPriceContractParams = [
      this.getDatastoreContractAddress(chain as ChainKey),
      [market, indexToken.address, longToken.address, shortToken.address],
      [indexPrices.ask, indexPrices.bid],
      [longPrices.ask, longPrices.bid],
      [shortPrices.ask, shortPrices.bid],
      utils.keccak256(utils.defaultAbiCoder.encode(['string'], [this.settings.PNL_FACTOR_TYPE])),
    ]
    const readerContract = this.getReaderContract(chain)
    // Prices have a spread from min to max. The last param (maximize-true/false) decides whether to maximize the market token price
    // or not. We get both values and return the median.
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, true),
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(utils.formatUnits(maximizedValue, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(utils.formatUnits(minimizedValue, SIGNED_PRICE_DECIMALS))
    const result = median([minimizedPrice, maximizedPrice])

    return {
      data: {
        result,
        sources,
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

  // Fetches the lwba price info from multiple source EAs, calculates the median for bids and asks per asset and fixes the price precision
  private async fetchPrices(
    assets: string[],
    dataRequestedTimestamp: number,
    decimals: Map<string, number>,
  ) {
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

    const prices = medianValues.map((v) => {
      const decimal = decimals.get(v.asset)
      if (!decimal) {
        throw new Error(`Missing token decimals for '${v.asset}'`)
      }
      return {
        ...v,
        ask: toFixed(v.ask, decimal),
        bid: toFixed(v.bid, decimal),
      }
    })

    return {
      prices,
      sources: priceProviders,
    }
  }

  private async resolveTokenMeta(chain: ChainKey, symbol: string): Promise<TokenMeta> {
    const tokenMeta = await this.tokenResolver.get(chain, symbol)
    const address = tokenMeta?.address
    const decimals = tokenMeta?.decimals
    if (!address || !decimals) {
      throw new Error(`Missing token metadata for '${symbol}' on '${chain}'`)
    }
    return { address, decimals, symbol }
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
    if (asset === 'WBTC.b' || asset === 'stBTC') {
      return 'BTC'
    }
    if (asset === 'WETH') {
      return 'ETH'
    }
    if (asset === 'USDC.e') {
      return 'USDC'
    }
    return asset
  }

  /*
    For every asset check that we received responses from the required number of source EAs to accurately calculate the median price of the asset.
  */
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

  private getProvider(chain: ChainKey): ethers.providers.JsonRpcProvider {
    if (this.providers[chain]) return this.providers[chain]!
    const p =
      chain === 'botanix'
        ? new ethers.providers.JsonRpcProvider(
            this.settings.BOTANIX_RPC_URL,
            this.settings.BOTANIX_CHAIN_ID,
          )
        : new ethers.providers.JsonRpcProvider(
            this.settings.ARBITRUM_RPC_URL,
            this.settings.ARBITRUM_CHAIN_ID,
          )
    this.providers[chain] = p
    return p
  }

  private getReaderContract(chain: ChainKey): ethers.Contract {
    if (this.readers[chain]) return this.readers[chain]!
    const addr =
      chain === 'botanix'
        ? this.settings.BOTANIX_READER_CONTRACT_ADDRESS
        : this.settings.READER_CONTRACT_ADDRESS
    const reader = new ethers.Contract(addr, abi, this.getProvider(chain))
    this.readers[chain] = reader
    return reader
  }

  private getDatastoreContractAddress(chain: ChainKey): string {
    return chain === 'botanix'
      ? this.settings.BOTANIX_DATASTORE_CONTRACT_ADDRESS
      : this.settings.DATASTORE_CONTRACT_ADDRESS
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
