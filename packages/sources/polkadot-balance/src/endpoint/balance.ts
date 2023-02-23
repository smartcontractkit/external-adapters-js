import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
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
  responseCache!: ResponseCache<{
    Request: EndpointTypes['Request']
    Response: EndpointTypes['Response']
  }>

  async initialize(dependencies: TransportDependencies<EndpointTypes>): Promise<void> {
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
      for (const address of addresses) {
        const codec = await api.query.system.account(address)
        const balance: ProviderResponse = JSON.parse(JSON.stringify(codec.toJSON()))
        if (balance) {
          result.push({
            address,
            balance: parseInt(balance.data?.free || '0x0', 16).toString(),
          })
        }
      }
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
    await this.responseCache.write([{ params: req.requestContext.data, response }])
    return response
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
