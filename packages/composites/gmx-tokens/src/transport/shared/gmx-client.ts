import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { AbiCoder, ethers, getAddress, keccak256 } from 'ethers'
import { ChainKey } from '../../endpoint/gm-price'
import { AdapterSettings, getResolvedChainSettings } from './chain'
import { Market, Token } from './utils'

type TokenResponse = { tokens: Token[] }
type MarketResponse = { markets: Market[] }

const abi = AbiCoder.defaultAbiCoder()
const DATA_STREAM_ID = keccak256(abi.encode(['string'], ['DATA_STREAM_ID']))

const hashData = (types: string[], values: unknown[]): string => {
  return keccak256(abi.encode(types, values))
}

export const dataStreamIdKey = (token: string): string => {
  return hashData(['bytes32', 'address'], [DATA_STREAM_ID, getAddress(token)])
}

export type ResolveFeedIdParams = {
  dataStoreContract: ethers.Contract
  tokenAddress: string
  tokenSymbol: string
  dataRequestedTimestamp: number
}

export const resolveFeedId = async ({
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

export class GmxClient {
  constructor(private readonly requester: Requester, private readonly settings: AdapterSettings) {}

  private async fetchMetadata<T>(chain: ChainKey, type: 'token' | 'market'): Promise<T> {
    const { tokenMetadataUrl, marketMetadataUrl } = getResolvedChainSettings(this.settings, chain)
    const url = type === 'token' ? tokenMetadataUrl : marketMetadataUrl
    if (!url) {
      throw new Error(`Metadata URL not configured for ${type} on chain ${chain}`)
    }

    const req = { url, method: 'GET', timeout: this.settings.GLV_INFO_API_TIMEOUT_MS }
    const { response } = await this.requester.request<T>(JSON.stringify(req), req)
    return response.data
  }

  async listTokens(chain: ChainKey): Promise<Token[]> {
    const data = await this.fetchMetadata<TokenResponse>(chain, 'token')
    return data.tokens
  }

  async getTokenBySymbol(symbol: string, chain: ChainKey): Promise<Token> {
    const tokens = await this.listTokens(chain)
    const target = symbol.toUpperCase()
    const token = tokens.find((item) => item.symbol.toUpperCase() === target)
    if (!token) {
      throw new Error(`Token with symbol "${symbol}" not found`)
    }
    return token
  }

  async getTokenByAddress(address: string, chain: ChainKey): Promise<Token> {
    const tokens = await this.listTokens(chain)
    const normalizedAddress = address.toLowerCase()
    const token = tokens.find((item) => item.address.toLowerCase() === normalizedAddress)
    if (!token) {
      throw new Error(`Token with address "${address}" not found`)
    }
    return token
  }

  async listMarkets(chain: ChainKey): Promise<Market[]> {
    const data = await this.fetchMetadata<MarketResponse>(chain, 'market')
    return data.markets
  }

  async getMarketByToken(marketToken: string, chain: ChainKey): Promise<Market> {
    const markets = await this.listMarkets(chain)
    const normalized = marketToken.toLowerCase()
    const market = markets.find((item) => item.marketToken.toLowerCase() === normalized)
    if (!market) {
      throw new Error(`Market with token "${marketToken}" not found`)
    }
    return market
  }
}
