import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  makeLogger,
  sleep,
  validateResultNumber,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AminaAuth } from './auth'

const logger = makeLogger('ReserveTransport')

type RequestParams = typeof inputParameters.validated

type Position = {
  isin?: string
  quantity?: unknown
}

type PositionsPage = {
  positions: Position[]
  totalPages: number
  last: boolean
}

// The provider serves 20 positions per page by default and accepts up to 2000.
const PAGE_SIZE = 20

export class ReserveTransport extends SubscriptionTransport<BaseEndpointTypes> {
  auth!: AminaAuth
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName
    this.auth = new AminaAuth(this.requester, adapterSettings)
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  async handleRequest(param: RequestParams): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest()
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

  async _handleRequest(): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const path = `/api/b2c/v1/securities/portfolios/${this.settings.AMINA_PORTFOLIO}/positions`
    const positions: Position[] = []
    let firstPageRequestedUnixMs: number | undefined
    let lastPageReceivedUnixMs: number | undefined

    for (let page = 0; ; page += 1) {
      const { response, timestamps } = await this.fetchPage(page, path)
      const pageData = response.data
      if (
        !Array.isArray(pageData?.positions) ||
        !Number.isInteger(pageData?.totalPages) ||
        typeof pageData?.last !== 'boolean'
      ) {
        throw new AdapterError({
          statusCode: 502,
          message: 'The data provider returned an unusable positions page',
        })
      }
      firstPageRequestedUnixMs ??= timestamps.providerDataRequestedUnixMs
      lastPageReceivedUnixMs = timestamps.providerDataReceivedUnixMs
      positions.push(...pageData.positions)

      if (pageData.last) {
        break
      }
      if (page + 1 >= pageData.totalPages) {
        throw new AdapterError({
          statusCode: 502,
          message: 'The data provider returned more pages than totalPages',
        })
      }
    }

    const isin = this.settings.AMINA_ISIN
    const matches = positions.filter((position) => position.isin === isin)
    const matched = matches[0]
    if (matched === undefined) {
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider returned no position for ISIN ${isin}`,
      })
    }
    if (matches.length > 1) {
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider returned more than one position for ISIN ${isin}`,
      })
    }

    const quantity = matched.quantity
    const validation = validateResultNumber(
      quantity,
      `The data provider returned an unusable quantity for ISIN ${isin}`,
    )
    // The published amount is a share count, which the provider gives as a
    // number. A numeric string is not a usable quantity and is not coerced.
    if (typeof quantity !== 'number' || 'errorMessage' in validation) {
      throw new AdapterError({
        statusCode: 502,
        message: `The data provider returned an unusable quantity for ISIN ${isin}`,
      })
    }

    return {
      data: {
        result: validation.result,
        ripcord: false,
      },
      result: validation.result,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs: firstPageRequestedUnixMs as number,
        providerDataReceivedUnixMs: lastPageReceivedUnixMs as number,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  // A rejected access token is renewed once and the same page is repeated. A
  // second rejection is published as an error.
  private async fetchPage(page: number, path: string) {
    const accessToken = await this.auth.getAccessToken()
    try {
      return await this.sendPage(page, path, accessToken)
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error
      }
    }

    const renewedAccessToken = await this.auth.renewAccessToken()
    try {
      return await this.sendPage(page, path, renewedAccessToken)
    } catch (error) {
      if (isUnauthorized(error)) {
        throw new AdapterError({
          statusCode: 502,
          message: 'The data provider rejected the renewed access token',
        })
      }
      throw error
    }
  }

  private async sendPage(page: number, path: string, accessToken: string) {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: { page },
      transportName: this.name,
    })
    return this.requester.request<PositionsPage>(requestKey, {
      method: 'GET',
      baseURL: this.settings.API_ENDPOINT,
      url: path,
      params: { page, size: PAGE_SIZE },
      headers: this.auth.positionsHeaders(accessToken, path),
    })
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof AdapterDataProviderError && error.providerStatusCode === 401
}

export const reserveTransport = new ReserveTransport()
