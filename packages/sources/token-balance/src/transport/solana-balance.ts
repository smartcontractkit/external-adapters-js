import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Commitment, Connection, PublicKey } from '@solana/web3.js'
import { AddressWithBalance, BaseEndpointTypes, inputParameters } from '../endpoint/solana-balance'
import { getSolanaRpcUrl } from './solana-utils'

const logger = makeLogger('Token Balance - Salana Balance')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 9

export class SolanaBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  connection!: Connection

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    if (!adapterSettings.SOLANA_RPC_URL) {
      logger.warn('SOLANA_RPC_URL is missing')
    }
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(_context: EndpointContext<BaseEndpointTypes>, param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const result = await this.getTokenBalances(param.addresses)

    return {
      data: {
        result,
        decimals: RESULT_DECIMALS,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async getTokenBalances(
    addresses: {
      address: string
    }[],
  ): Promise<AddressWithBalance[]> {
    const runner = new GroupRunner(this.config.GROUP_SIZE)
    const getBalance = runner.wrapFunction(
      async ({ address }: { address: string }): Promise<AddressWithBalance> => {
        const balance = await this.getTokenBalance(address)
        return {
          address,
          balance: balance.toString(),
        }
      },
    )
    return await Promise.all(addresses.map(getBalance))
  }

  async getTokenBalance(address: string): Promise<number> {
    const result = await this.getConnection().getAccountInfo(new PublicKey(address))
    if (!result) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Account not found for address ${address}`,
      })
    }
    return result.lamports
  }

  getConnection(): Connection {
    return (this.connection ??= new Connection(
      getSolanaRpcUrl(this.config),
      this.config.SOLANA_COMMITMENT as Commitment,
    ))
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const solanaBalanceTransport = new SolanaBalanceTransport()
