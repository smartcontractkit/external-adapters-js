import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, DyDxResponse, inputParameters } from '../endpoint/send'
import { getPricePayload, PriceDataPoint, PriceStarkPayload, requireNormalizedPrice } from './utils'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'

const logger = makeLogger('DyDxTransport')

export type DyDxTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: PriceStarkPayload
    ResponseBody: DyDxResponse
  }
}

export class DyDxTransport implements Transport<DyDxTransportTypes> {
  name!: string
  responseCache!: ResponseCache<DyDxTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<DyDxTransportTypes>,
    _adapterSettings: DyDxTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    config: DyDxTransportTypes['Settings'],
  ): Promise<AdapterResponse<DyDxTransportTypes['Response']>> {
    const { asset, result } = req.requestContext.data

    const priceData: PriceDataPoint = {
      oracleName: config.ORACLE_NAME,
      assetName: asset,
      // Current timestamp in seconds
      timestamp: Math.floor(Date.now() / 1000),
      price: requireNormalizedPrice(result),
    }

    const payload = await getPricePayload(config.PRIVATE_KEY, config.STARK_MESSAGE, priceData)

    const requestConfig = {
      baseURL: config.API_ENDPOINT,
      url: '',
      method: 'POST',
      data: payload,
    }

    logger.debug('Sending payload: ', { payload })

    const providerDataRequestedUnixMs = Date.now()

    const providerResponse = await this.requester.request<DyDxResponse>(
      calculateHttpRequestKey<DyDxTransportTypes>({
        context: {
          adapterSettings: config,
          inputParameters,
          endpointName: req.requestContext.endpointName,
        },
        data: payload,
        transportName: this.name,
      }),
      requestConfig,
    )

    const response = {
      data: {
        result: providerResponse.response.data,
      },
      statusCode: 200,
      result: providerResponse.response.data.price,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [{ params: req.requestContext.data, response }])
    return response
  }
}

export const transport = new DyDxTransport()
