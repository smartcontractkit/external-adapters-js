import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/http'
import { createResponses, prepareRequests } from './utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: object
  }
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests,
  parseResponse: (params, apiResponse) => {
    return createResponses<BaseEndpointTypes>({
      params,
      apiResponse,
      mapParam: (param) => ({
        apiName: param.apiName,
        dataPaths: [{ name: 'result', path: param.dataPath }],
        ripcordPath: param.ripcordPath,
        ripcordDisabledValue: param.ripcordDisabledValue,
        providerIndicatedTimePath: param.providerIndicatedTimePath,
      }),
      mapResponse: (multiHttpResponse) => ({
        result: String(multiHttpResponse.result),
        data: {
          ...multiHttpResponse.data,
          result: String(multiHttpResponse.data.result),
        },
        timestamps: multiHttpResponse.timestamps,
      }),
    })
  },
}

// Exported for testing
export class GenericApiHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new GenericApiHttpTransport()
