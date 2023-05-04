import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterCustomError } from '@chainlink/external-adapter-framework/validation/error'
import { latestUpdateIsCurrentDay, tenorInRange } from '../../utils'
import {
  CfBenchmarksBIRCTransport,
  inputParameters,
  RestEndpointTypes,
  VALID_TENORS,
} from '../common/birc'

const logger = makeLogger('CFBenchmarksBIRCEndpoint')

const restTransport = new CfBenchmarksBIRCTransport({
  prepareRequests: (params, config) => {
    const { API_USERNAME, API_PASSWORD, API_ENDPOINT } = config
    const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')

    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: API_ENDPOINT,
          url: '/v1/curves',
          headers: {
            Authorization: `Basic ${encodedCreds}`,
          },
          params: {
            id: 'BIRC',
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const latestUpdate = res.data.payload[res.data.payload.length - 1]
      const key = param.tenor as VALID_TENORS
      const value = Number(latestUpdate.tenors[key])

      if (!latestUpdateIsCurrentDay(latestUpdate.time)) {
        const warning = 'Latest update from response is not in current day'
        logger.warn(warning, { latestUpdate })
      }

      if (!tenorInRange(value)) {
        const error = 'Tenor is out of range (-1 to 1)'
        logger.error(error, { value, tenor: key })
        throw new AdapterCustomError({ message: error })
      }

      return {
        params: param,
        response: {
          result: value,
          data: {
            result: value,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(res.data.serverTime).getTime(),
          },
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<RestEndpointTypes>({
  name: 'birc',
  transport: restTransport,
  inputParameters,
})
