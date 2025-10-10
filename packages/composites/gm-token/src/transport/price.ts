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
  decimals,
  toFixed,
  median,
  PriceData,
  SIGNED_PRICE_DECIMALS,
  tokenAddresses,
  Source,
} from './utils'
import abi from './../config/readerAbi.json'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('GMToken')

type RequestParams = typeof inputParameters.validated

export type GmTokenTransportTypes = BaseEndpointTypes

export class GmTokenTransport extends SubscriptionTransport<GmTokenTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTokenTransportTypes>
  requester!: Requester
  provider!: ethers.providers.JsonRpcProvider
  readerContract!: ethers.Contract
  abiEncoder!: utils.AbiCoder
  settings!: GmTokenTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<GmTokenTransportTypes>,
    adapterSettings: GmTokenTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ARBITRUM_RPC_URL,
      adapterSettings.ARBITRUM_CHAIN_ID,
    )
    this.readerContract = new ethers.Contract(
      adapterSettings.READER_CONTRACT_ADDRESS,
      abi,
      this.provider,
    )
    this.requester = dependencies.requester
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
    const { index, long, short, market } = param

    const assets = [index, long, short]

    const providerDataRequestedUnixMs = Date.now()

    const {
      prices: [indexPrices, longPrices, shortPrices],
      sources,
    } = await this.fetchPrices(assets, providerDataRequestedUnixMs)

    const indexToken = tokenAddresses.arbitrum[index as keyof typeof tokenAddresses.arbitrum]
    const longToken = tokenAddresses.arbitrum[long as keyof typeof tokenAddresses.arbitrum]
    const shortToken = tokenAddresses.arbitrum[short as keyof typeof tokenAddresses.arbitrum]

    const tokenPriceContractParams = [
      this.settings.DATASTORE_CONTRACT_ADDRESS,
      [market, indexToken, longToken, shortToken],
      [indexPrices.ask, indexPrices.bid],
      [longPrices.ask, longPrices.bid],
      [shortPrices.ask, shortPrices.bid],
      utils.keccak256(utils.defaultAbiCoder.encode(['string'], [this.settings.PNL_FACTOR_TYPE])),
    ]

    // Prices have a spread from min to max. The last param (maximize-true/false) decides whether to maximize the market token price
    // or not. We get both values and return the median.
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      this.readerContract.getMarketTokenPrice(...tokenPriceContractParams, true),
      this.readerContract.getMarketTokenPrice(...tokenPriceContractParams, false),
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

    const prices = medianValues.map((v) => ({
      ...v,
      ask: toFixed(v.ask, decimals[v.asset as keyof typeof decimals]),
      bid: toFixed(v.bid, decimals[v.asset as keyof typeof decimals]),
    }))

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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
