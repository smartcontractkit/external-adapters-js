import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { AddressWithBalance, BaseEndpointTypes, inputParameters } from '../endpoint/litecoin'
import { getLitecoinRpcUrl } from './litecoin-utils'

const logger = makeLogger('Token Balance - Litecoin')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 8

type LitecoinAddressResponse = {
  address: string
  balance: string
  totalReceived: string
  totalSent: string
  unconfirmedBalance: string
  unconfirmedTxs: number
  txs: number
}

export class LitecoinTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName
    this.requester = dependencies.requester
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
          balance,
        }
      },
    )
    return await Promise.all(addresses.map(getBalance))
  }

  async getTokenBalance(address: string): Promise<string> {
    const url = `/api/v2/address/${encodeURIComponent(address)}`
    const requestConfig = {
      method: 'GET' as const,
      baseURL: getLitecoinRpcUrl(this.config),
      url,
      params: {
        details: 'tokenBalances',
      },
    }

    const result = await this.requester.request<LitecoinAddressResponse>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: { url },
        transportName: this.name,
      }),
      requestConfig,
    )

    return result.response.data.balance
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const litecoinTransport = new LitecoinTransport()
