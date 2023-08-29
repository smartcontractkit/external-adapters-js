import { config } from '../config'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies, Transport } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { ApiPromise, WsProvider } from '@polkadot/api'

const logger = makeLogger('PolkadotBalanceLogger')

interface ProviderResponse {
  nonce: number
  data?: {
    free?: string
  }
}

export class BalanceTransport implements Transport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const wsProvider = new WsProvider(settings.RPC_URL)
    const api = await ApiPromise.create({ provider: wsProvider })
    await api.isReady

    const providerDataRequestedUnixMs = Date.now()
    const result: { address: string; balance: string }[] = []

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

export const transport = new BalanceTransport()
