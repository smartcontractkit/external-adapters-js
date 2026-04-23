import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, RequestParams } from '../endpoint/reserves'
import { fixedPointToNumber } from '../utils/fixed-point'
import { AddressListRepo } from './address'
import { BalanceSourceRepo } from './balance'
import { ComponentRepo } from './component'
import { ConversionRepo } from './conversion'
import { fetchFromProvider, shortJsonForError } from './utils'

const logger = makeLogger('ReservesTransport')

export type ReservesTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

export class ReservesTransport extends SubscriptionTransport<ReservesTransportTypes> {
  name!: string
  config!: ReservesTransportTypes['Settings']
  responseCache!: ResponseCache<ReservesTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<ReservesTransportTypes>,
    adapterSettings: ReservesTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.requester = dependencies.requester
  }
  async backgroundHandler(
    context: EndpointContext<ReservesTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(context: EndpointContext<ReservesTransportTypes>, param: RequestParams) {
    let response: AdapterResponse<ReservesTransportTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
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
    context: EndpointContext<ReservesTransportTypes>,
    params: RequestParams,
  ): Promise<AdapterResponse<ReservesTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const resultDecimals = params.resultDecimals
    const boundFetchFromProvider = fetchFromProvider.bind(this, this.name, this.requester, context)
    const boundShortJsonForError = shortJsonForError.bind(
      this,
      this.config.MAX_RESPONSE_TEXT_IN_ERROR_MESSAGE,
    )

    const addressListRepo = new AddressListRepo({
      config: params.addressLists,
      fetchFromProvider: boundFetchFromProvider,
      shortJsonForError: boundShortJsonForError,
    })

    const balanceSourceRepo = new BalanceSourceRepo({
      config: params.balanceSources,
      defaultDecimals: resultDecimals,
      fetchFromProvider: boundFetchFromProvider,
      shortJsonForError: boundShortJsonForError,
    })

    const conversionRepo = new ConversionRepo({
      config: params.conversions,
      defaultDecimals: resultDecimals,
      fetchFromProvider: boundFetchFromProvider,
      shortJsonForError: boundShortJsonForError,
    })

    const componentRepo = new ComponentRepo({
      config: params.components,
      addressListRepo,
      balanceSourceRepo,
      conversionRepo,
    })

    const totalReserves = await componentRepo.getTotalReserves(resultDecimals)

    const result = totalReserves.amount.toString()
    const resultAsNumber = fixedPointToNumber(totalReserves)
    const decimals = totalReserves.decimals

    return {
      data: {
        result,
        resultAsNumber,
        decimals,
        components: await componentRepo.forResponse(),
        conversionRates: await conversionRepo.getRatesForResponse(),
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: ReservesTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reservesTransport = new ReservesTransport()
