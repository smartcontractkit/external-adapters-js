import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
import { format, isSaturday, isSunday, subDays } from 'date-fns'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import schedule from 'node-schedule'
import { getStartingAndEndingDates, isBeforeTime, isInTimeRange } from './utils'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('Superstate')

export interface ResponseSchema {
  fund_id: number
  net_asset_value_date: string
  net_asset_value: string
  assets_under_management: string
  outstanding_shares: string
  net_income_expenses: string
}

const RETRY_INTERVAL_MINUTES = 1

export class NavTransport implements Transport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    settings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = transportName
    this.requester = dependencies.requester
    this.settings = settings
    this.endpointName = endpointName
    this.execute()
    this.runScheduler()
  }

  // Run 'execute' function every day at 9:09 AM ET
  runScheduler() {
    const rule = new schedule.RecurrenceRule()
    rule.hour = 9
    rule.minute = 9
    rule.tz = 'America/New_York'

    schedule.scheduleJob(rule, () => this.execute())
  }

  // execute is either called by scheduler or when the EA (re)starts. Makes a request to DP and saves the response in the cache.
  // In case the DP returns stale data the function will be executed again several times,
  // before finalizing and saving the last available data to a cache.
  async execute(retryCount = 0) {
    const providerDataRequestedUnixMs = Date.now()
    const apiResponse = await this.makeRequest()
    const providerDataReceivedUnixMs = Date.now()

    if (!apiResponse.data?.length) {
      const response = {
        errorMessage: `The data provider did not return any value.`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      await this.responseCache.write(this.name, [{ params: [], response }])
      return
    }

    const data = apiResponse.data[0]

    const result = Number(data.net_asset_value)

    // DP updates previous working day's price on the next working day at 9:09 AM ET
    // If there is no fresh price update, we try to re-fetch the API until 10:30 AM ET
    // Skips checks and re-running on weekends
    if (this.shouldCheckForStaleData()) {
      // At this point we know that conditions are met, and we should check for stale data and retry if it's not updated.
      // If the most recent update from DP is not from Yesterday, the data might be stale
      const today = format(new Date(), 'MM/dd/yyyy')
      const yesterday = format(subDays(today, 1), 'MM/dd/yyyy')
      if (data.net_asset_value_date !== yesterday) {
        // We should retry until we get fresh data or the time is after 10:30 AM ET
        if (isBeforeTime('10:30:00', 'America/New_York')) {
          logger.warn(
            `Stale data received from DP. Latest update from ${
              data.net_asset_value_date
            }. Current date - ${today}. Retry attempt ${
              retryCount + 1
            }. Retrying after ${RETRY_INTERVAL_MINUTES} minute(s)`,
          )
          retryCount++
          setTimeout(() => this.execute(retryCount), RETRY_INTERVAL_MINUTES * 60 * 1000)
          return
        } else {
          logger.warn(
            `Max retires reached. Writing stale data to cache. Latest update - ${data.net_asset_value_date}. Current date - ${today}.`,
          )
        }
      }
    }

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
    await this.responseCache.write(this.name, [{ params: [], response }])
  }

  async makeRequest() {
    const { startDate, endDate } = getStartingAndEndingDates(this.settings.LOOKBACK_DAYS)

    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `funds/${this.settings.FUND_ID}/nav-daily`,
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }

    const reqKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters: new InputParameters({}),
        endpointName: this.endpointName,
      },
      data: requestConfig,
      transportName: this.name,
    })

    const { response } = await this.requester.request<ResponseSchema[]>(reqKey, requestConfig)
    return response
  }

  // Determines whether we should check for stale data
  shouldCheckForStaleData() {
    // No need to check on weekends, the data from DP will be the same
    if (isSaturday(new Date()) || isSunday(new Date())) return false

    // If it's a business day we need to check for stale data only if the current time is within certain time range (retry period).
    // If it's before 09:09 we don't need to check as it's too soon and there will be no update from DP,
    // the scheduler will call the execute function once it's 09:09.
    // If it's after 10:30, it's too late, and we won't update the value until the next business day.
    // This is needed for EA restarts as the EA still has to make retries during retry period
    return isInTimeRange('09:09:00', '10:30:00', 'America/New_York')
  }
}
