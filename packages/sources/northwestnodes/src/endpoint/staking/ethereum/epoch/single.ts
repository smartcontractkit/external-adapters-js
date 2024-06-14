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
    Result: string
  }
  Provider: {
    ResponseBody: IEpochResponse
    RequestBody: null
  }
}

const transport = new HttpTransport<EndpointType>({
  prepareRequests: (params, settings) =>
    params.map((p) => {
      const url = '/staking/ethereum/epoch/single/' + p.id
      logger.debug('prepareRequests: ' + url)
      return {
        params,
        request: {
          baseURL: settings.API_ENDPOINT,
          url: url,
          method: 'GET',
          params: settings.API_KEY ? { key: settings.API_KEY } : undefined,
        },
      }
    }),
  parseResponse: (params, res) => {
    return params.map((p) => {
      const statusCode = res.status
      const statusText = res.statusText
      if (statusCode == 200) {
        const json = JSON.stringify(res.data)
        logger.debug('parseResponse: ' + statusCode + ' OK; ' + json)
        return {
          params: p,
          response: {
            data: json,
            result: json,
            statusCode,
          },
        }
      } else {
        logger.error('parseResponse: ' + statusCode + ' ' + statusText)
        return {
          params: p,
          response: {
            statusCode: statusCode,
            errorMessage: statusText,
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
