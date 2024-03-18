import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { IEpochResponse } from '../../../../responses/IEpochResponse'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../../../../config'

const logger = makeLogger('NWN_EthStakingListEpochEndpoint')

const inputParameters = new InputParameters({
  count: {
    description:
      'The number of past epochs to download, minimum 1 and maximum of 21,000. Default 225 (1 day)',
    type: 'number',
    required: false,
    default: 225,
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
    ResponseBody: IEpochResponse[]
    RequestBody: null
  }
}

const transport = new HttpTransport<EndpointType>({
  prepareRequests: (params, settings) =>
    params.map((p) => {
      const url = '/staking/ethereum/epoch/list/' + p.count
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
  parseResponse: (params: (typeof inputParameters.validated)[], res) => {
    return params.map((p) => {
      if (res.status == 200) {
        const json = JSON.stringify(res.data)
        logger.debug('parseResponse: ' + res.status + ' OK; ' + json)
        return {
          params: p,
          response: {
            data: json,
            result: json,
            statusCode: res.status,
          },
        }
      } else {
        logger.error('parseResponse: ' + res.status + ' ' + res.statusText)
        return {
          params: p,
          response: {
            statusCode: res.status,
            errorMessage: res.statusText,
          },
        }
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointType>({
  name: 'staking-ethereum-epoch-list',
  transport,
  inputParameters,
})
