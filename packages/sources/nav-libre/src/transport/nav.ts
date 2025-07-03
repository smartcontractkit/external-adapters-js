import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import dayjs from 'dayjs'
import { BaseEndpointTypes } from '../endpoint/nav'
import { getNavRequestHeaders } from './authentication'

export interface ResponseSchema {
  Data: {
    'Trading Level Net ROR': {
      DTD: number
      MTD: number
      QTD: number
      YTD: number
      ITD: number
    }
    'Net ROR': {
      DTD: number
      MTD: number
      QTD: number
      YTD: number
      ITD: number
    }
    'NAV Per Share': number
    'Next NAV Price': number
    'Accounting Date': string
    'Ending Balance': number
  }[]
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
      // Set defaults for fromDate and toDate if not provided
      const now = dayjs()
      const fromDate = param.fromDate || now.subtract(7, 'day').format('MM-DD-YYYY')
      const toDate = param.toDate || now.format('MM-DD-YYYY')

      // Validate date format MM-DD-YYYY
      const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/
      if (fromDate && !dateRegex.test(fromDate)) {
        throw new Error('fromDate must be in MM-DD-YYYY format')
      }
      if (toDate && !dateRegex.test(toDate)) {
        throw new Error('toDate must be in MM-DD-YYYY format')
      }

      const method = 'GET'
      const path =
        '/navapigateway/api/v1/FundAccountingData/GetOfficialNAVAndPerformanceReturnsForFund'
      const query = `globalFundID=${param.globalFundID}&fromDate=${fromDate}&toDate=${toDate}`
      // Body is empy for GET
      const body = ''

      const headers = getNavRequestHeaders(
        method,
        path + '?' + query,
        body,
        config.API_KEY,
        config.SECRET_KEY,
      )
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: path,
          headers,
          params: {
            globalFundID: param.globalFundID,
            fromDate,
            toDate,
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data || !Array.isArray(response.data.Data) || response.data.Data.length === 0) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `No NAV data returned for fund ${param.globalFundID}`,
          statusCode: 502,
        },
      }))
    }

    // Find the latest NAV entry by Accounting Date
    const latest = response.data.Data.reduce((a, b) => {
      return new Date(a['Accounting Date']) > new Date(b['Accounting Date']) ? a : b
    })

    const timestamps = {
      providerIndicatedTimeUnixMs: new Date(latest['Accounting Date']).getTime(),
    }

    return params.map((param) => ({
      params: param,
      response: {
        result: latest['NAV Per Share'],
        data: {
          navPerShare: latest['NAV Per Share'],
          navDate: latest['Accounting Date'],
          globalFundID: param.globalFundID,
        },
        timestamps,
        statusCode: 200,
      },
    }))
  },
})
