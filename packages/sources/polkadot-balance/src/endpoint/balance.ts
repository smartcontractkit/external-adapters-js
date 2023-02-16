import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { Cache } from '@chainlink/external-adapter-framework/cache'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { customSettings } from '../config'

const logger = makeLogger('PolkadotBalanceLogger')

const inputParameters = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
} as const

interface RequestParams {
  addresses: Address[]
}

type Address = {
  address: string
}

interface BalanceResponse {
  address: string
  balance: string
}

interface ProviderResponse {
  nonce: number
  data?: {
    free?: string
  }
}

interface ResponseSchema {
  Data: {
    result: BalanceResponse[]
  }
  Result: null
}

type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: ResponseSchema
  CustomSettings: typeof customSettings
}

export class BalanceTransport implements Transport<EndpointTypes> {
  cache!: Cache<AdapterResponse<EndpointTypes['Response']>>
  responseCache!: ResponseCache<{
    Request: EndpointTypes['Request']
    Response: EndpointTypes['Response']
  }>

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
    this.cache = dependencies.cache as Cache<AdapterResponse<EndpointTypes['Response']>>
    this.responseCache = dependencies.responseCache
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    config: AdapterConfig<typeof customSettings>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const wsProvider = new WsProvider(config.RPC_URL)
    const api = await ApiPromise.create({ provider: wsProvider })
    await api.isReady

    const providerDataRequestedUnixMs = Date.now()
    const result: BalanceResponse[] = []

    // Can't utilize a "multi" query here since it doesn't retrieve a snapshot of the balance directly
    // Also addresses are not returned in the results preventing balances to be mapped to them
    const addresses = req.requestContext.data.addresses.map(({ address }) => address)
    try {
      await Promise.all(
        addresses.map((address) => {
          const balancePromise = api.query.system.account(address).then((codec) => {
            const balance: ProviderResponse = JSON.parse(JSON.stringify(codec.toJSON()))
            if (balance) {
              result.push({
                address,
                balance: parseInt(balance.data?.free || '0x0', 16).toString(),
              })
            }
          })
          return balancePromise
        }),
      )
    } catch (e) {
      logger.error(e, 'Failed to retrieve balances')
      return {
        statusCode: 500,
        errorMessage: 'Failed to retrieve balances',
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    const providerDataReceivedUnixMs = Date.now()

    const response = {
      data: {
        result,
      },
      result: null,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.cache.set(req.requestContext.cacheKey, response, config.CACHE_MAX_AGE)
    return response
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
