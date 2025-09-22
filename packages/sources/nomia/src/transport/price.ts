import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import schedule from 'node-schedule'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'

const logger = makeLogger('nomia')

export interface ResponseSchema {
  [key: string]: {
    Results: {
      Data: {
        DataValue: string
        LineNumber: string
        TableName: string
        TimePeriod: string
      }[]
      Error?: {
        APIErrorCode: string
        APIErrorDescription: string
      }
    }
  }
}

type RequestParams = typeof inputParameters.validated

export type NomiaTransportTypes = BaseEndpointTypes

export class NomiaTransport extends SubscriptionTransport<NomiaTransportTypes> {
  settings!: NomiaTransportTypes['Settings']
  requester!: Requester
  endpointName!: string
  params!: RequestParams[]

  async initialize(
    dependencies: TransportDependencies<NomiaTransportTypes>,
    adapterSettings: NomiaTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
    this.runScheduler()
  }

  async backgroundHandler(_: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    this.params = entries
  }

  runScheduler() {
    schedule.scheduleJob(`0 */${this.settings.API_FREQUENCY} * * * *`, async () => {
      logger.info(`Scheduled execution started at ${Date.now()}`)
      for (let i = 0; i < this.params.length; i++) {
        await this.executeRequest(this.params[i])
      }
    })
  }

  getSubscriptionTtlFromConfig(adapterSettings: NomiaTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async executeRequest(param: RequestParams) {
    const providerDataRequestedUnixMs = Date.now()
    const apiResponse = await this.makeRequest(param)
    const providerDataReceivedUnixMs = Date.now()

    const data = Object.values(apiResponse.data)
    if (!data || !data[0] || !data[0].Results.Data?.length) {
      const response = {
        errorMessage:
          data[0].Results?.Error?.APIErrorDescription || 'No data returned from provider',
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      await this.responseCache.write(this.name, [{ params: param, response }])
      return
    }
    const t = new URLSearchParams(param.query)
    const record = data[0].Results.Data.filter(
      (d) => d.TableName === t.get('TableName') && d.LineNumber === t.get('LineNumber'),
    ).reduce((a, b) => (a.TimePeriod > b.TimePeriod ? a : b))

    const result = Number(record.DataValue.replace(/,/g, '')) // Remove commas for parsing as a number
    const response = {
      data: {
        result,
      },
      result,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async makeRequest(param: RequestParams) {
    const query = new URLSearchParams(param.query)
    query.set('UserID', this.settings.API_KEY)

    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    const yearValue = param.singleYear ? currentYear : `${lastYear},${currentYear}`

    const decodedQuery = `${query.toString()}&Year=${yearValue}`
    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `${this.settings.API_ENDPOINT}?${decodedQuery}`,
    }

    const reqKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: requestConfig,
      transportName: this.name,
    })

    const { response } = await this.requester.request<ResponseSchema>(reqKey, requestConfig)
    return response
  }
}

export const nomiaTransport = new NomiaTransport()
