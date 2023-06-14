import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { IEpochResponse } from '../../../../responses/IEpochResponse'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../../../../config'

const logger = makeLogger('NWN_EthStakingSingleEpochEndpoint')

const inputParameters = new InputParameters({
  id: {
    description: 'The id of the epoch, can be "finalized" or a numeric',
    type: 'string',
    required: false,
    default: 'finalized',
  },
})

type EndpointType = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Data: string
    Result: null
  }
  Provider: {
    ResponseBody: IEpochResponse
    RequestBody: null
  }
}

const transport = new HttpTransport<EndpointType>({
  prepareRequests: (params: (typeof inputParameters.validated)[], settings) => {
    const baseURL = settings.API_ENDPOINT
    const id = params[0].id.toLowerCase()
    const url = '/v2/staking/ethereum/epoch/single/' + id
    const query = settings.API_KEY ? { key: settings.API_KEY } : undefined

    logger.debug(
      'prepareRequests: baseURL=' +
        baseURL +
        '; id=' +
        id +
        '; url=' +
        url +
        '; query=' +
        query +
        ';',
    )

    return {
      params,
      request: {
        baseURL,
        url,
        method: 'GET',
        params: query,
      },
    }
  },
  parseResponse: (params: (typeof inputParameters.validated)[], res) => {
    return params.map((p) => {
      const statusCode = res.status
      const statusText = res.statusText

      logger.debug('parseResponse: statusCode=' + statusCode + '; statusText=' + statusText + ';')

      if (statusCode == 200) {
        return {
          params: p,
          response: {
            data: JSON.stringify(res.data),
            status: res.status,
            result: null,
          },
        }
      } else {
        return {
          params: p,
          response: {
            data: res.statusText,
            status: res.status,
            result: null,
          },
        }
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointType>({
  name: 'staking-ethereum-epoch-single',
  transport,
  inputParameters,
})
