import { getCryptoPrice } from '@chainlink/data-engine-adapter'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { ethers } from 'ethers'
import abi from '../config/readerAbi.json'
import { ChainKey, GmPriceEndpointTypes, gmPriceInputParameters } from '../endpoint/gm-price'
import { dataStreamIdKey } from './gmx-keys'
import { TokenMeta, TokenResolver } from './token-resolver'
import { median, PriceData, SIGNED_PRICE_DECIMALS, toFixed, unwrapAsset } from './utils'

const logger = makeLogger('GmxTokensGmTransport')

type RequestParams = typeof gmPriceInputParameters.validated

export type GmTransportTypes = GmPriceEndpointTypes

const CHAIN_RPC_KEY: Record<ChainKey, keyof GmTransportTypes['Settings']> = {
  arbitrum: 'ARBITRUM_RPC_URL',
  botanix: 'BOTANIX_RPC_URL',
  avalanche: 'AVALANCHE_RPC_URL',
}

const CHAIN_CHAIN_ID_KEY: Record<ChainKey, keyof GmTransportTypes['Settings']> = {
  arbitrum: 'ARBITRUM_CHAIN_ID',
  botanix: 'BOTANIX_CHAIN_ID',
  avalanche: 'AVALANCHE_CHAIN_ID',
}

const CHAIN_READER_KEY: Record<ChainKey, keyof GmTransportTypes['Settings']> = {
  arbitrum: 'READER_CONTRACT_ADDRESS',
  botanix: 'BOTANIX_READER_CONTRACT_ADDRESS',
  avalanche: 'AVALANCHE_READER_CONTRACT_ADDRESS',
}

const CHAIN_DATASTORE_KEY: Record<ChainKey, keyof GmTransportTypes['Settings']> = {
  arbitrum: 'DATASTORE_CONTRACT_ADDRESS',
  botanix: 'BOTANIX_DATASTORE_CONTRACT_ADDRESS',
  avalanche: 'AVALANCHE_DATASTORE_CONTRACT_ADDRESS',
}

export class GmTokenTransport extends SubscriptionTransport<GmTransportTypes> {
  name!: string
  responseCache!: ResponseCache<GmTransportTypes>
  requester!: Requester
  settings!: GmTransportTypes['Settings']
  tokenResolver!: TokenResolver
  private providers: Partial<Record<ChainKey, ethers.JsonRpcProvider>> = {}
  private readers: Partial<Record<ChainKey, ethers.Contract>> = {}
  private dataStores: Partial<Record<ChainKey, ethers.Contract>> = {}

  async initialize(
    dependencies: TransportDependencies<GmTransportTypes>,
    adapterSettings: GmTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.tokenResolver = new TokenResolver(this.requester, this.settings)
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

    const assets = [index, long, short]

    const providerDataRequestedUnixMs = Date.now()

    const [indexToken, longToken, shortToken] = await Promise.all([
      this.tokenResolver.getToken(chain, index),
      this.tokenResolver.getToken(chain, long),
      this.tokenResolver.getToken(chain, short),
    ])
    const decimalsMap = new Map(
      [indexToken, longToken, shortToken].map((t) => [t.symbol, t.decimals]),
    )

    const {
      prices: [indexPrices, longPrices, shortPrices],
      sources,
    } = await this.fetchPrices(assets, providerDataRequestedUnixMs, decimalsMap, chain)

    const tokenPriceContractParams = [
      this.getDatastoreContractAddress(chain as ChainKey),
      [market, indexToken.address, longToken.address, shortToken.address],
      [indexPrices.ask, indexPrices.bid],
      [longPrices.ask, longPrices.bid],
      [shortPrices.ask, shortPrices.bid],
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['string'], [this.settings.PNL_FACTOR_TYPE]),
      ),
    ]
    const readerContract = this.getReaderContract(chain)
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

  private async fetchPrices(
    assets: string[],
    dataRequestedTimestamp: number,
    decimals: Map<string, number>,
    chain: ChainKey,
  ) {
    const priceData = {} as PriceData

    const source = { url: this.settings.DATA_ENGINE_ADAPTER_URL, name: 'data-engine' as const }

    const priceProviders: Record<string, string[]> = {}

    const tokenMetadata = await Promise.all(
      assets.map(async (asset) => ({
        asset,
        token: await this.tokenResolver.getToken(chain, asset),
      })),
    )

    if (!source.url) {
      throw new Error('DATA_ENGINE_ADAPTER_URL must be set')
    }

    await Promise.all(
      tokenMetadata.map(async ({ asset, token }) => {
        const feedId = await this.getFeedId(token, chain, dataRequestedTimestamp)
        try {
          const {
            bid,
            ask,
            decimals: priceDecimals,
          } = await getCryptoPrice(feedId, source.url, this.requester)

          const bidNum = Number(ethers.formatUnits(bid, priceDecimals))
          const askNum = Number(ethers.formatUnits(ask, priceDecimals))
          priceData[asset] = {
            bids: [...(priceData[asset]?.bids || []), bidNum],
            asks: [...(priceData[asset]?.asks || []), askNum],
          }

          const base = unwrapAsset(asset)
          priceProviders[base] = priceProviders[base]
            ? [...new Set([...priceProviders[base], source.name])]
            : [source.name]
        } catch (error) {
          const e = error as Error
          logger.error(
            `Error fetching data for ${asset} from ${source.name}, url - ${source.url}: ${e.message}`,
          )
        }
      }),
    )

    this.validateRequiredResponses(priceProviders, assets, dataRequestedTimestamp)

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

  private calculateMedian(assets: string[], priceData: PriceData) {
    return assets.map((asset) => {
      const medianBid = median([...new Set(priceData[asset].bids)])
      const medianAsk = median([...new Set(priceData[asset].asks)])
      return { asset, bid: medianBid, ask: medianAsk }
    })
  }

  private validateRequiredResponses(
    priceProviders: Record<string, string[]> = {},
    assets: string[],
    dataRequestedTimestamp: number,
  ) {
    const allSources = ['data-engine']
    if (!Object.entries(priceProviders)?.length) {
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Missing responses from '${allSources.join(',')}' for all assets.`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    assets.forEach((asset) => {
      const base = unwrapAsset(asset)
      const respondedSources = priceProviders[base]

      if (!respondedSources || respondedSources.length < 1) {
        throw new AdapterDataProviderError(
          {
            statusCode: 502,
            message: `Cannot calculate median price for '${asset}'. Missing responses from '${allSources.join(
              ',',
            )}'.`,
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

  private getProvider(chain: ChainKey): ethers.JsonRpcProvider {
    if (this.providers[chain]) return this.providers[chain]!
    const rpcUrl = this.getStringSetting(CHAIN_RPC_KEY[chain])
    const chainId = this.getNumberSetting(CHAIN_CHAIN_ID_KEY[chain])
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId)
    this.providers[chain] = provider
    return provider
  }

  private getReaderContract(chain: ChainKey): ethers.Contract {
    if (this.readers[chain]) return this.readers[chain]!
    const addr = this.getStringSetting(CHAIN_READER_KEY[chain])
    const reader = new ethers.Contract(addr, abi, this.getProvider(chain))
    this.readers[chain] = reader
    return reader
  }

  private getDatastoreContractAddress(chain: ChainKey): string {
    return this.getStringSetting(CHAIN_DATASTORE_KEY[chain])
  }

  private getDataStoreContract(chain: ChainKey): ethers.Contract {
    if (this.dataStores[chain]) return this.dataStores[chain]!
    const contract = new ethers.Contract(
      this.getDatastoreContractAddress(chain),
      ['function getBytes32(bytes32 key) view returns (bytes32)'],
      this.getProvider(chain),
    )
    this.dataStores[chain] = contract
    return contract
  }

  private async getFeedId(
    token: TokenMeta,
    chain: ChainKey,
    dataRequestedTimestamp: number,
  ): Promise<string> {
    const dataStoreContract = this.getDataStoreContract(chain)

    const key = dataStreamIdKey(token.address)
    try {
      const feedId = await dataStoreContract.getBytes32(key)
      if (feedId === ethers.ZeroHash) {
        throw new AdapterDataProviderError(
          {
            statusCode: 502,
            message: `Feed ID not set in datastore for token '${token.symbol}'`,
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
      const e = error as Error
      throw new AdapterDataProviderError(
        {
          statusCode: 502,
          message: `Unable to retrieve feed ID for ${token.symbol}: ${e.message}`,
        },
        {
          providerDataRequestedUnixMs: dataRequestedTimestamp,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
  }

  private getStringSetting(key: keyof GmTransportTypes['Settings']): string {
    const value = this.settings[key]
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Config value '${String(key)}' must be set as a string`)
    }
    return value
  }

  private getNumberSetting(key: keyof GmTransportTypes['Settings']): number {
    const value = this.settings[key]
    if (typeof value !== 'number') {
      throw new Error(`Config value '${String(key)}' must be set as a number`)
    }
    return value
  }

  getSubscriptionTtlFromConfig(adapterSettings: GmTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gmTokenTransport = new GmTokenTransport()
