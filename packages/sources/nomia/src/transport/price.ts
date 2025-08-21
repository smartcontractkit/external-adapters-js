import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('nomia')

export interface ResponseSchema {
  [key: string]: {
    Results: {
      Data: {
        DataValue: string
        LineNumber: string
        TableName: string
        TimePeriod: string
      }[]
    }
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const query = new URLSearchParams(param.query)
      query.set('UserID', config.API_KEY)

      const currentYear = new Date().getFullYear()
      const lastYear = currentYear - 1
      const yearValue = param.singleYear ? currentYear : `${lastYear},${currentYear}`

      const decodedQuery = `${query.toString()}&Year=${yearValue}`
      return {
        params: [param],
        request: {
          baseURL: `${config.API_ENDPOINT}?${decodedQuery}`,
        },
      }
    })
  },
  parseResponse: (params, response) => {
    const data = Object.values(response.data)
    if (!data || !data[0] || !data[0].Results.Data?.length) {
      logger.error('No data found in response', response.data)
      return []
    }

    return params.map((param) => {
      const t = new URLSearchParams(param.query)
      const record = data[0].Results.Data.filter(
        (d) => d.TableName === t.get('TableName') && d.LineNumber === t.get('LineNumber'),
      ).reduce((a, b) => (a.TimePeriod > b.TimePeriod ? a : b))
      if (!record || !record.DataValue) {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage:
              'Record not found or DataValue is empty. Please check the query parameters.',
          },
        }
      }
      const result = Number(record.DataValue.replace(/,/g, '')) // Remove commas for parsing as a number

      return {
        params: param,
        response: {
          result: result,
          data: {
            result: result,
          },
        },
      }
    })
  },
})
