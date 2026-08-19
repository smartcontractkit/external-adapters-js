import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { isValidBitcoinAddress } from '@chainlink/external-adapter-framework/validation/address'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/circle'

const logger = makeLogger('CircleTransport')

type RequestParams = Record<string, never>

const emptyInputParameters = new InputParameters({})

export interface ResponseSchema {
  data: {
    address: string
  }[]
  ripcord?: boolean
}

export class CircleTransport extends SubscriptionTransport<BaseEndpointTypes> {
  endpointName!: string
  config!: BaseEndpointTypes['Settings']
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
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
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
    _params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const addresses = await this.getAllAddresses(this.config.CIRCLE_API_PAGE_SIZE)

    for (const address of addresses) {
      if (!isValidBitcoinAddress(address)) {
        throw new AdapterError({
          message: `Invalid Bitcoin address returned from data provider: '${address}'`,
          statusCode: 502,
        })
      }
    }

    return {
      data: {
        result: addresses.map((address) => ({
          address,
          network: 'bitcoin',
          chainId: 'mainnet',
        })),
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

  async getAllAddresses(pageSize: number): Promise<string[]> {
    const addresses: string[] = []
    let page: string[] = []
    do {
      page = await this.getAddressPage({ pageSize, offset: addresses.length })
      addresses.push(...page)
    } while (page.length !== 0)
    return addresses
  }

  async getAddressPage({
    pageSize: limit,
    offset,
  }: {
    pageSize: number
    offset: number
  }): Promise<string[]> {
    const requestConfig = {
      baseURL: this.config.CIRCLE_API_URL,
      params: {
        limit,
        offset,
      },
    }

    const response = await this.requester.request<ResponseSchema>(
      calculateHttpRequestKey<BaseEndpointTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters: emptyInputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.params,
        transportName: this.name,
      }),
      requestConfig,
    )

    const { ripcord, data } = response.response.data

    if (ripcord !== undefined && ripcord !== false) {
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider returned { ripcord: ${ripcord} } for offset ${offset} and limit ${limit}`,
      })
    }

    if (data === undefined) {
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider didn't return any value for offset ${offset} and limit ${limit}`,
      })
    }

    return data.map(({ address }) => address)
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const circleTransport = new CircleTransport()
