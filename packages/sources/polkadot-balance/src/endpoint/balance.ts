import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { config } from '../config'

const logger = makeLogger('PolkadotBalanceLogger')

const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    required: true,
    array: true,
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
    type: {
      address: {
        type: 'string',
        description: 'an address to get the balance of',
        required: true,
      },
    },
  },
})

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
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export class BalanceTransport implements Transport<EndpointTypes> {
  name!: string
  responseCache!: ResponseCache<EndpointTypes>

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
    _: typeof config.settings,
    __: string,
    name: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = name
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const wsProvider = new WsProvider(settings.RPC_URL)
    const api = await ApiPromise.create({ provider: wsProvider })
    await api.isReady

    const providerDataRequestedUnixMs = Date.now()
    const result: BalanceResponse[] = []

    // Can't utilize a "multi" query here since it doesn't retrieve a snapshot of the balance directly
    // Also addresses are not returned in the results preventing balances to be mapped to them
    const addresses = req.requestContext.data.addresses.map(({ address }) => address)
    try {
      // Break addresses down into batches to execute asynchronously
      // Firing requests for all addresses all at once could hit rate limiting for large address pools
      const batchedAddresses = splitArrayIntoChunks(addresses, settings.BATCH_SIZE)
      for (const batch of batchedAddresses) {
        await Promise.all(
          batch.map((address) => {
            const balancePromise = api.query.system.account(address).then((codec) => {
              const balance = codec.toJSON() as unknown as ProviderResponse
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
    await this.responseCache.write(this.name, [{ params: req.requestContext.data, response }])
    return response
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
