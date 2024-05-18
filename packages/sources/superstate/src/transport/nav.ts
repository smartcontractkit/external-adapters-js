import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { isWeekend } from 'date-fns'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import schedule from 'node-schedule'
import {
  getPreviousNonWeekendDay,
  getStartingAndEndingDates,
  isBeforeTime,
  isInTimeRange,
} from './utils'

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
const TZ = 'America/New_York'

// Custom transport implementation that takes incoming requests, adds them into a SET, and makes requests to DP
// on a specific time every day, after receiving a signal from scheduler.
export class NavTransport implements Transport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string
  fundIdsSet!: Set<number>

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
    this.fundIdsSet = new Set()
    this.runScheduler()
  }

  // foregroundExecute is executed when there is a new request with unique fundId.
  // Adds fundId in the request to a SET and calls execute function
  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']> | void> {
    const { fundId } = req.requestContext.data
    if (!this.fundIdsSet.has(fundId)) {
      this.fundIdsSet.add(fundId)
      logger.info(`Added new fund id - ${fundId}`)
      return this.execute(fundId)
    }
  }

  // Runs 'execute' function every day at 9:09 AM ET (if fundIdsSet is not empty)
  runScheduler() {
    const rule = new schedule.RecurrenceRule()
    rule.hour = 9
    rule.minute = 9
    rule.tz = TZ

    schedule.scheduleJob(rule, () => {
      logger.info(
        `Scheduled execution started at ${Date.now()}. FundIdSet - ${[...this.fundIdsSet].join(
          ',',
        )}`,
      )
      ;[...this.fundIdsSet].map(async (fundId) => this.execute(fundId))
    })
  }

  // execute is either called by scheduler or foregroundExecute.
  // Makes a request to DP and saves the response in the cache.
  // In case the DP returns stale data the function will be executed again several times
  // before finalizing and saving the last returned data to a cache.
  async execute(fundId: number, retryCount = 0) {
    const providerDataRequestedUnixMs = Date.now()
    const apiResponse = await this.makeRequest(fundId)
    const providerDataReceivedUnixMs = Date.now()

    if (!apiResponse.data?.length) {
      const response = {
        errorMessage: `The data provider did not return any value for fundId: ${fundId}`,
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
      await this.responseCache.write(this.name, [{ params: { fundId }, response }])
      return
    }

    const data = apiResponse.data[0]
    const result = Number(data.net_asset_value)

    // DP updates previous working day's price on the next working day at 9:09 AM ET
    // If there is no fresh price data, we try to re-fetch the API until 10:30 AM ET
    // Skips checks and re-running on weekends
    if (this.shouldCheckForExpectedData()) {
      // At this point we know that conditions are met, and we should check for stale data and retry if it's not updated.
      // If the most recent update from DP is not from previous working day, the data might be stale
      const expectedDate = getPreviousNonWeekendDay(TZ)
      if (data.net_asset_value_date !== expectedDate) {
        // We should retry fetching DP until we get fresh data or the time is after 10:30 AM ET
        if (isBeforeTime('10:30:00', TZ)) {
          logger.warn(
            `Expected last update - ${expectedDate}, actual ${
              data.net_asset_value_date
            }. Retry attempt ${retryCount + 1}. Retrying after ${RETRY_INTERVAL_MINUTES} minute(s)`,
          )
          retryCount++
          setTimeout(() => this.execute(fundId, retryCount), RETRY_INTERVAL_MINUTES * 60 * 1000)
          // We don't `return` here and let the value be stored in cache on purpose.
          // This way the EA will respond with the latest value from DP (even though it's not the value that the EA expects),
          // while it tries to get a fresh update.
        } else {
          logger.warn(
            `Max retires reached. Expected update - ${expectedDate}. Latest update - ${data.net_asset_value_date}.`,
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
    await this.responseCache.write(this.name, [{ params: { fundId }, response }])
    return response
  }

  async makeRequest(fundId: number) {
    const { startDate, endDate } = getStartingAndEndingDates(this.settings.LOOKBACK_DAYS)
    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `funds/${fundId}/nav-daily`,
      params: {
        start_date: startDate,
        end_date: endDate,
      },
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

    const { response } = await this.requester.request<ResponseSchema[]>(reqKey, requestConfig)
    return response
  }

  // Determines whether we should check for stale data
  shouldCheckForExpectedData() {
    // No need to check on weekends, the data from DP will be the same
    if (isWeekend(new Date())) return false

    // If it's a business day we need to check for stale data only if the current ET time is within certain time range (retry period).
    // If it's before 09:09 AM we don't need to check as it's too soon and there will be no update from DP,
    // the scheduler will call the execute function once it's 09:09.
    // If it's after 10:30 AM, it's too late, and we won't update the value until the next business day.
    // This is needed for EA restarts as the EA still has to make retries during retry period
    return isInTimeRange('09:09:00', '10:30:00', TZ)
  }
}
