import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('nomia')

export interface ResponseSchema {
  [key: string]: {
    Results: {
      Data?: {
        DataValue: string
        LineNumber: string
        TableName: string
        TimePeriod: string
      }[]
      Error?: {
        APIErrorCode: string
        APIErrorDescription: string
      }
      Parameter?: unknown
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
    // Validate basic response structure
    if (!response.data || typeof response.data !== 'object') {
      logger.error(
        `Invalid response from BEA API - not an object error: ${JSON.stringify(response.data)}`,
      )
      return params.map((param) => ({
        params: param,
        response: {
          statusCode: 502,
          errorMessage: 'Invalid response structure from BEA API',
        },
      }))
    }

    // BEA API responses should have a BEAAPI wrapper, but handle any top-level key
    const responseKeys = Object.keys(response.data)
    if (responseKeys.length === 0) {
      logger.error(`Empty response from BEA API error: ${JSON.stringify(response.data)}`)
      return params.map((param) => ({
        params: param,
        response: {
          statusCode: 502,
          errorMessage: 'Empty response from BEA API',
        },
      }))
    }

    // Get the first key's data (typically BEAAPI)
    const topLevelKey = responseKeys[0]
    const beaApiData = response.data[topLevelKey]

    if (!beaApiData || typeof beaApiData !== 'object' || !beaApiData.Results) {
      logger.error(
        `Invalid BEA API response structure - missing Results error: ${JSON.stringify({
          topLevelKey,
          responseData: response.data,
          availableKeys: responseKeys,
        })}`,
      )
      return params.map((param) => ({
        params: param,
        response: {
          statusCode: 502,
          errorMessage: 'Invalid response structure from BEA API - missing Results',
        },
      }))
    }

    const beaResults = beaApiData.Results

    // Check for BEA API errors and log them
    if (beaResults.Error) {
      const { APIErrorCode, APIErrorDescription } = beaResults.Error
      logger.error(
        `BEA API Error: error: ${JSON.stringify({
          errorCode: APIErrorCode,
          errorDescription: APIErrorDescription,
          requestParams: params.map((p) => p.query).join(', '),
        })}`,
      )

      return params.map((param) => ({
        params: param,
        response: {
          statusCode: 502,
          errorMessage: `BEA API Error ${APIErrorCode}: ${APIErrorDescription}`,
        },
      }))
    }

    // Check for missing data - keep original behavior
    if (!beaResults.Data?.length) {
      logger.error(`No data found in response error: ${JSON.stringify(response.data)}`)
      return []
    }

    return params.map((param) => {
      const t = new URLSearchParams(param.query)
      const record = beaResults
        .Data!.filter(
          (d) => d.TableName === t.get('TableName') && d.LineNumber === t.get('LineNumber'),
        )
        .reduce((a, b) => (a.TimePeriod > b.TimePeriod ? a : b))

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
