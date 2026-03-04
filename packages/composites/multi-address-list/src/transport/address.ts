import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import schedule from 'node-schedule'
import { AddressListTransportTypes, getAggregatedAddressList, RequestParams } from './common'

const logger = makeLogger('AddressListTransport')

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
    if (retryCount >= this.settings.MAX_RETRIES) {
      logger.error(`Max retry count reached for params: ${JSON.stringify(params)}`)
      return
    }

    try {
      const response = await getAggregatedAddressList(params, this.requester, this.settings)
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

  getSubscriptionTtlFromConfig(adapterSettings: AddressListTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const addressListTransport = new AddressListTransport()
