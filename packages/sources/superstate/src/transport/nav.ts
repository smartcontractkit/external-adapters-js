import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { isWeekend } from 'date-fns'
import schedule from 'node-schedule'
import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import {
  AssetsUnderManagement,
  convertToTimestampMs,
  getPreviousNonWeekendDay,
  getStartingAndEndingDates,
  isBeforeTime,
  isInTimeRange,
  toTimezoneDate,
} from './utils'

const logger = makeLogger('nav')

export interface ResponseSchema {
  fund_id: number
  net_asset_value_date: string
  net_asset_value: string
  assets_under_management: string
  outstanding_shares: string
  net_income_expenses: string
}

const TZ = 'America/New_York'

type RequestParams = typeof inputParameters.validated

// Custom transport implementation that takes incoming requests, adds them into a SET, and makes requests to DP
// on a specific time every day, after receiving a signal from scheduler.
export class NavTransport implements Transport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string
  fundsMap!: Map<string, RequestParams>

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
    this.fundsMap = new Map()
    this.runScheduler(settings.NAV_CRON_INTERVAL_MIN)
  }

  // registerRequest is invoked on every valid request to EA
  // Adds fundId in the request to a SET
  async registerRequest(req: AdapterRequest<typeof inputParameters.validated>) {
    const { fundId, reportValue, startTime, endTime } = req.requestContext.data
    const mapKey = `${fundId}+${reportValue}+${startTime}+${endTime}`
    if (!this.fundsMap.has(mapKey)) {
      this.fundsMap.set(mapKey, req.requestContext.data)
      logger.info(
        `Added new fund id - ${fundId} - reportValue ${reportValue} - window ${startTime}-${endTime}`,
      )
    }
  }

  // foregroundExecute is executed when there is a new request/fundId that is not in the cache
  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']> | void> {
    return this.execute(req.requestContext.data)
  }

  // Runs 'execute' function every day between startTime & endTime once per interval minutes (if fundIdsSet is not empty)
  runScheduler(interval: number) {
    schedule.scheduleJob(`*/${interval} * * * *`, () => {
      this.fundsMap.forEach((param) => {
        const { fundId, reportValue, startTime, endTime } = param
        if (isInTimeRange(startTime, endTime, TZ)) {
          logger.info(
            `Scheduled execution started at ${Date.now()} for 
            fund id - ${fundId} - reportValue ${reportValue} - window ${startTime}-${endTime}`,
          )
          this.execute(param).catch((err) => {
            logger.error(err)
          })
        }
      })
    })
  }

  // execute is either called by scheduler or foregroundExecute.
  // Makes a request to DP and saves the response in the cache.
  // In case the DP returns stale data the function will be executed again several times
  // before finalizing and saving the last returned data to a cache.
  async execute(param: RequestParams, retryCount = 0) {
    const providerDataRequestedUnixMs = Date.now()
    const apiResponse = await this.makeRequest(param.fundId)
    const providerDataReceivedUnixMs = Date.now()

    if (!apiResponse.data?.length) {
      const response = {
        errorMessage: `The data provider did not return any value for fundId: ${param.fundId}`,
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

    const data = apiResponse.data[0]
    let result = Number(data.net_asset_value)
    if (param.reportValue == AssetsUnderManagement) {
      result = Number(data.assets_under_management)
    }

    // DP updates previous working day's price on the next working day at startTime ET
    // If there is no fresh price data, we try to re-fetch the API until endTime ET
    // Skips checks and re-running on weekends
    if (this.shouldCheckForExpectedData(param.startTime, param.endTime)) {
      // At this point we know that conditions are met, and we should check for stale data and retry if it's not updated.
      // If the most recent update from DP is not from previous working day, the data might be stale
      const expectedDate = getPreviousNonWeekendDay(TZ)
      if (data.net_asset_value_date !== expectedDate) {
        // We should retry fetching DP until we get fresh data or the time is after endTime ET
        if (isBeforeTime(param.endTime, TZ)) {
          logger.warn(
            `Expected last update - ${expectedDate}, actual ${
              data.net_asset_value_date
            }. Retry attempt ${retryCount + 1}. Retrying after ${
              this.settings.RETRY_INTERVAL_MS
            } ms`,
          )
          retryCount++
          setTimeout(() => this.execute(param, retryCount), this.settings.RETRY_INTERVAL_MS)
          // We don't `return` here and let the value be stored in cache on purpose.
          // This way the EA will respond with the latest value from DP (even though it's not the value that the EA expects),
          // while it tries to get a fresh update.
        } else {
          logger.warn(
            `Max retries reached. Expected update - ${expectedDate}. Latest update - ${data.net_asset_value_date}.`,
          )
        }
      }
    }

    const response = {
      data: {
        result,
        nav: Number(data.net_asset_value),
        aum: Number(data.assets_under_management),
        navDate: data.net_asset_value_date,
        navDateTimestampMs: convertToTimestampMs(data.net_asset_value_date),
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
  shouldCheckForExpectedData(startTime: string, endTime: string) {
    // No need to check on weekends, the data from DP will be the same
    if (isWeekend(toTimezoneDate(new Date(), TZ))) return false

    // If it's a business day we need to check for stale data only if the current ET time is within certain time range (retry period).
    // If it's before startTime we don't need to check as it's too soon and there will be no update from DP,
    // the scheduler will call the execute function once it's startTime.
    // If it's after endTime, it's too late, and we won't update the value until the next business day.
    // This is needed for EA restarts as the EA still has to make retries during retry period
    return isInTimeRange(startTime, endTime, TZ)
  }
}
export const navTransport = new NavTransport()
