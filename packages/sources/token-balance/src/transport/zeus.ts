import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/zeus'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'

const logger = makeLogger('Token Balances - Zeus')

interface ResponseSchema {
  accountName: string
  result: {
    id: string
    address: string
    symbol: string
    addressType: string
    balance: string
    walletName: string
  }[]
  count: number
  totalReserveinBtc: string
  totalToken: string
  minerFees: string
  lastUpdatedAt: string
}

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 8

export class ZeusBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  config!: BaseEndpointTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
    this.endpointName = endpointName
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
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
    _param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const requestConfig = {
      baseURL: this.config.ZEUS_ZBTC_API_URL,
    }

    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.config,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: {},
      transportName: this.name,
    })

    const response = await this.requester.request<ResponseSchema>(requestKey, requestConfig)
    const result = response.response.data.minerFees

    const [intPart, fracPart = ''] = result.split('.')
    const minerFees = BigInt((intPart + fracPart.padEnd(8, '0')).replace(/^0+/, '') || '0')

    return {
      data: {
        result: String(minerFees),
        decimals: RESULT_DECIMALS,
      },
      statusCode: 200,
      result: String(minerFees),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const zeusBalanceTransport = new ZeusBalanceTransport()
