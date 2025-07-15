import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { getFund } from './fund'
import { getFundDates } from './fund-dates'

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { clampStartByBusinessDays, parseDateString, toDateString } from './date-utils'
const logger = makeLogger('NavLibreTransport')

type RequestParams = typeof inputParameters.validated

export class NavLibreTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  name!: string
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.endpointName = endpointName
    this.requester = dependencies.requester
    this.config = adapterSettings
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
    logger.debug(`Handling request for globalFundID: ${param.globalFundID}`)
    const { FromDate: earliestPossibleFromStr, ToDate: latestPossibleToStr } = await getFundDates({
      globalFundID: param.globalFundID,
      baseURL: this.config.API_ENDPOINT,
      apiKey: this.config.API_KEY,
      secret: this.config.SECRET_KEY,
      requester: this.requester,
    })

    const earliestPossibleFrom = parseDateString(earliestPossibleFromStr)
    const latestPossibleTo = parseDateString(latestPossibleToStr)

    // Clamp to trailing-7-business-days window
    const preferredFrom = clampStartByBusinessDays(
      earliestPossibleFrom,
      latestPossibleTo,
      7, // 7 business days
    )

    logger.debug(
      `Fetching NAV for globalFundID: ${param.globalFundID} from ${preferredFrom} to ${latestPossibleTo}`,
    )
    const fund = await getFund({
      globalFundID: param.globalFundID,
      fromDate: toDateString(preferredFrom),
      toDate: toDateString(latestPossibleTo),
      baseURL: this.config.API_ENDPOINT,
      apiKey: this.config.API_KEY,
      secret: this.config.SECRET_KEY,
      requester: this.requester,
    })

    const ACCOUNTING_DATE_KEY = 'Accounting Date'
    const NAV_PER_SHARE_KEY = 'NAV Per Share'
    // Find the latest NAV entry by Accounting Date
    const latest = fund.reduce((latestRow, row) =>
      parseDateString(row[ACCOUNTING_DATE_KEY]) > parseDateString(latestRow[ACCOUNTING_DATE_KEY])
        ? row
        : latestRow,
    )
    // Assumes UTC
    const providerIndicatedTimeUnixMs = parseDateString(latest[ACCOUNTING_DATE_KEY]).getTime()
    return {
      statusCode: 200,
      result: latest[NAV_PER_SHARE_KEY],
      data: {
        globalFundID: param.globalFundID,
        navPerShare: latest[NAV_PER_SHARE_KEY],
        navDate: latest[ACCOUNTING_DATE_KEY],
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const navLibreTransport = new NavLibreTransport()
