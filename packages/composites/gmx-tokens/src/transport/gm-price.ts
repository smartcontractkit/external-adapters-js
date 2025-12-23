import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import abi from '../config/readerAbi.json'
import { GmPriceEndpointTypes, gmPriceInputParameters } from '../endpoint/gm-price'
import { ChainContextFactory } from './shared/chain'
import { GmxClient } from './shared/gmx-client'
import { fetchMedianPricesForAssets } from './shared/token-prices'
import { median, SIGNED_PRICE_DECIMALS, toFixed, unwrapAsset } from './shared/utils'

const logger = makeLogger('GmxTokensGmTransport')

type RequestParams = typeof gmPriceInputParameters.validated

export type GmTransportTypes = GmPriceEndpointTypes

export class GmTokenTransport extends SubscriptionTransport<GmTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTransportTypes>
  requester!: Requester
  settings!: GmTransportTypes['Settings']
  metadataClient!: GmxClient
  private chainContext!: ChainContextFactory

  async initialize(
    dependencies: TransportDependencies<GmTransportTypes>,
    adapterSettings: GmTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.chainContext = new ChainContextFactory(this.settings)
    this.metadataClient = new GmxClient(this.requester, adapterSettings)
  }

  async backgroundHandler(
    context: EndpointContext<GmTransportTypes>,
    entries: TypeFromDefinition<GmTransportTypes['Parameters']>[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<GmTransportTypes['Response']>
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
  ): Promise<AdapterResponse<GmTransportTypes['Response']>> {
    const { index, long, short, market, chain } = param
    const providerDataRequestedUnixMs = Date.now()
    const marketNormal = market.toLowerCase()

    const [indexToken, longToken, shortToken] = await Promise.all([
      this.metadataClient.getTokenBySymbol(index, chain),
      this.metadataClient.getTokenBySymbol(long, chain),
      this.metadataClient.getTokenBySymbol(short, chain),
    ])
    const decimalsMap = new Map(
      [indexToken, longToken, shortToken].map((t) => [t.symbol, t.decimals]),
    )

    const priceRequestAssets = [
      {
        symbol: indexToken.symbol,
        decimals: indexToken.decimals,
        address: indexToken.address,
        providerKey: unwrapAsset(indexToken.symbol),
      },
      {
        symbol: longToken.symbol,
        decimals: longToken.decimals,
        address: longToken.address,
        providerKey: unwrapAsset(longToken.symbol),
      },
      {
        symbol: shortToken.symbol,
        decimals: shortToken.decimals,
        address: shortToken.address,
        providerKey: unwrapAsset(shortToken.symbol),
      },
    ]

    const { medianValues, priceProviders: sources } = await fetchMedianPricesForAssets({
      assets: priceRequestAssets,
      requester: this.requester,
      dataEngineUrl: this.settings.DATA_ENGINE_ADAPTER_URL,
      dataStoreContract: this.chainContext.getDataStore(chain),
      dataRequestedTimestamp: providerDataRequestedUnixMs,
      onError: (asset, error) =>
        logger.error(
          `Error fetching data for ${asset} from data-engine, url - ${this.settings.DATA_ENGINE_ADAPTER_URL}: ${error.message}`,
        ),
    })

    const pricesMap = new Map(medianValues.map((value) => [value.asset, value] as const))
    const indexPrices = pricesMap.get(indexToken.symbol)
    const longPrices = pricesMap.get(longToken.symbol)
    const shortPrices = pricesMap.get(shortToken.symbol)

    if (!indexPrices || !longPrices || !shortPrices) {
      throw new Error('Missing price data for one or more GM assets')
    }

    const prices = [indexPrices, longPrices, shortPrices].map((price) => {
      const decimal = decimalsMap.get(price.asset)
      if (!decimal) {
        throw new Error(`Missing token decimals for '${price.asset}'`)
      }
      return {
        ...price,
        ask: toFixed(price.ask, decimal),
        bid: toFixed(price.bid, decimal),
      }
    })
    const [indexPriceFormatted, longPriceFormatted, shortPriceFormatted] = prices

    const tokenPriceContractParams = [
      this.chainContext.getDataStoreAddress(chain),
      [ethers.getAddress(marketNormal), indexToken.address, longToken.address, shortToken.address],
      [indexPriceFormatted.ask, indexPriceFormatted.bid],
      [longPriceFormatted.ask, longPriceFormatted.bid],
      [shortPriceFormatted.ask, shortPriceFormatted.bid],
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['string'], [this.settings.PNL_FACTOR_TYPE]),
      ),
    ]
    const readerContract = this.chainContext.getReaderContract(chain, abi)
    const [[maximizedValue], [minimizedValue]] = await Promise.all([
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, true),
      readerContract.getMarketTokenPrice(...tokenPriceContractParams, false),
    ])

    const maximizedPrice = Number(ethers.formatUnits(maximizedValue, SIGNED_PRICE_DECIMALS))
    const minimizedPrice = Number(ethers.formatUnits(minimizedValue, SIGNED_PRICE_DECIMALS))
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

  getSubscriptionTtlFromConfig(adapterSettings: GmTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
