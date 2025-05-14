import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/xrpl'

const logger = makeLogger('Token Balance - XRPL')

type RequestParams = typeof inputParameters.validated

const RESULT_DECIMALS = 18

type AccountLinesResponse = {
  result: {
    account: string
    ledger_hash?: string
    ledger_index?: number
    lines: {
      account: string
      balance: string // decimal number
      currency: string
      limit: string
      limit_peer: string
      no_ripple?: boolean
      no_ripple_peer?: boolean
      peer_authorized?: boolean
      quality_in: number
      quality_out: number
    }[]
    status?: string
    validated?: boolean
  }
}

export class XrplTransport extends SubscriptionTransport<BaseEndpointTypes> {
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

    if (!adapterSettings.XRPL_RPC_URL) {
      logger.error('Environment variable XRPL_RPC_URL is missing')
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
    _param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    // TODO: Implement the logic
    const result = '0'

    return {
      data: {
        result,
        decimals: RESULT_DECIMALS,
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

  getTokenBalances({
    addresses,
    tokenIssuerAddress,
  }: {
    addresses: {
      address: string
    }[]
    tokenIssuerAddress: string
  }): Promise<Decimal[]> {
    const runner = new GroupRunner(this.config.GROUP_SIZE)
    const getBalance = runner.wrapFunction(({ address }: { address: string }) =>
      this.getTokenBalance({ address: address, tokenIssuerAddress }),
    )
    return Promise.all(addresses.map(getBalance))
  }

  async getTokenBalance({
    address,
    tokenIssuerAddress,
  }: {
    address: string
    tokenIssuerAddress: string
  }): Promise<Decimal> {
    if (!this.config.XRPL_RPC_URL) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'Environment variable XRPL_RPC_URL is missing',
      })
    }

    const requestConfig = {
      method: 'POST',
      baseURL: this.config.XRPL_RPC_URL,
      data: {
        method: 'account_lines',
        params: [
          {
            account: address,
            ledger_index: 'validated',
            peer: tokenIssuerAddress,
          },
        ],
      },
    }

    const result = await this.requester.request<AccountLinesResponse>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.data,
        transportName: this.name,
      }),
      requestConfig,
    )

    let balance = new Decimal(0)
    for (const line of result.response.data.result.lines) {
      balance = balance.plus(new Decimal(line.balance))
    }
    return balance
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const xrplTransport = new XrplTransport()
