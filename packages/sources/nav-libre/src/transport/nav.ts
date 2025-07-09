import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { getFund } from './fund'
import { getFundDates } from './fund-dates'

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { clampToBusinessWindow, parseDateString, toDateString } from './date-utils'
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
    const { FromDate, ToDate } = await getFundDates(
      param.globalFundID,
      this.config.API_ENDPOINT,
      this.config.API_KEY,
      this.config.SECRET_KEY,
      this.requester,
    )
    let from = parseDateString(FromDate)
    const to = parseDateString(ToDate)
    from = clampToBusinessWindow(from, to)

    logger.debug(`Fetching NAV for globalFundID: ${param.globalFundID} from ${from} to ${to}`)
    const fund = await getFund(
      param.globalFundID,
      toDateString(from),
      toDateString(to),
      this.config.API_ENDPOINT,
      this.config.API_KEY,
      this.config.SECRET_KEY,
      this.requester,
    )

    // Find the latest NAV entry by Accounting Date
    const latest = fund.reduce((a, b) => {
      return new Date(a['Accounting Date']) > new Date(b['Accounting Date']) ? a : b
    })
    const [month, day, year] = latest['Accounting Date'].split('-').map(Number)
    // Assumes UTC
    const providerIndicatedTimeUnixMs = Date.UTC(year, month - 1, day) // month is 0-based
    return {
      statusCode: 200,
      result: latest['NAV Per Share'],
      data: {
        globalFundID: param.globalFundID,
        navPerShare: latest['NAV Per Share'],
        navDate: latest['Accounting Date'],
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
