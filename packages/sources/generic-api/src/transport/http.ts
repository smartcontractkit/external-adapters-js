import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/http'
import { GenericApiTransport } from './utils'

const logger = makeLogger('Single HTTP Transport')

// This was originally an HTTP transport and we wanted to keep the same
// endpoint.
export class GenericApiHttpTransport extends GenericApiTransport<BaseEndpointTypes> {
  constructor() {
    super({
      logger,
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
        statusCode: multiHttpResponse.statusCode,
        timestamps: multiHttpResponse.timestamps,
      }),
    })
  }
}

export const httpTransport = new GenericApiHttpTransport()
