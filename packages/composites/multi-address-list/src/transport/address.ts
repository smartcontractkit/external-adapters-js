import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/address'
import schedule from 'node-schedule'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'

const logger = makeLogger('AddressListTransport')

export type AddressListTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

interface PoRAdapterResponse {
  data: {
    result: {
      network: string
      chainId: string
      address: string
    }[]
  }
  statusCode: number
  result: null
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
  }
}

export class AddressListTransport extends SubscriptionTransport<AddressListTransportTypes> {
  name!: string
  responseCache!: ResponseCache<AddressListTransportTypes>
  requester!: Requester
  settings!: AddressListTransportTypes['Settings']
  activeParams: RequestParams[] = []

  async initialize(
    dependencies: TransportDependencies<AddressListTransportTypes>,
    adapterSettings: AddressListTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.runScheduler()
  }

  // backgroundHandler is used here to only update the subscription set and not to make the actual request.
  // The actual request is made in the execute function by the scheduler.
  async backgroundHandler(
    context: EndpointContext<AddressListTransportTypes>,
    entries: RequestParams[],
  ) {
    this.activeParams = entries
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  // Runs 'execute' function every day at a specific time
  runScheduler() {
    const rule = new schedule.RecurrenceRule()
    rule.hour = this.settings.SCHEDULER_HOUR
    rule.minute = this.settings.SCHEDULER_MINUTES
    rule.tz = this.settings.SCHEDULER_TIMEZONE

    schedule.scheduleJob(rule, () => {
      logger.info(
        `Scheduled execution started at ${new Date().toISOString()}. Params: ${JSON.stringify(
          this.activeParams,
        )}`,
      )
      this.activeParams.map(async (param) => this.execute(param))
    })
  }

  async execute(params: RequestParams, retryCount = 0) {
    const providerDataRequestedUnixMs = Date.now()

    if (retryCount >= this.settings.MAX_RETRIES) {
      logger.error(`Max retry count reached for params: ${JSON.stringify(params)}`)
      return
    }

    try {
      const addresses = await this.fetchSourceAddresses(params)
      logger.info(`Fetched ${addresses.length} addresses`)

      const response = {
        data: {
          result: addresses,
        },
        statusCode: 200,
        result: null,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      await this.responseCache.write(this.name, [
        {
          params,
          response,
        },
      ])
    } catch (e) {
      logger.error(e)
      retryCount = retryCount + 1
      setTimeout(() => this.execute(params, retryCount), this.settings.RETRY_INTERVAL_MS)
    }
  }

  async fetchSourceAddresses(params: RequestParams) {
    const { chainId, network, ...sources } = params

    const promises = Object.entries(sources)
      .filter(([_, sourceParams]) => sourceParams)
      .map(async ([sourceName, sourceParams]) => {
        // customInputValidation ensures that if the source EA is present in the input params, the corresponding env variable is also present
        const adapterUrl = `${sourceName.toUpperCase()}_ADAPTER_URL` as keyof typeof this.settings
        const requestConfig = {
          url: this.settings[adapterUrl] as string,
          method: 'POST',
          data: {
            data: {
              ...sourceParams,
              chainId: params.chainId,
              network: params.network,
            },
          },
        }

        const sourceResponse = await this.requester.request<PoRAdapterResponse>(
          JSON.stringify(requestConfig),
          requestConfig,
        )
        return sourceResponse.response.data.data.result
      })

    const addresses = await Promise.all(promises)
    return addresses.flat()
  }

  getSubscriptionTtlFromConfig(adapterSettings: AddressListTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const addressListTransport = new AddressListTransport()
