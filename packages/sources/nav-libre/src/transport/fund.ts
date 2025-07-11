import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRequestHeaders } from './authentication'

interface FundResponse {
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

export const getFund = async (
  globalFundID: number,
  fromDate: string,
  toDate: string,
  baseURL: string,
  apiKey: string,
  secret: string,
  requester: Requester,
): Promise<FundResponse['Data']> => {
  const method = 'GET'
  const url = `/navapigateway/api/v1/FundAccountingData/GetOfficialNAVAndPerformanceReturnsForFund?globalFundID=${globalFundID}&fromDate=${fromDate}&toDate=${toDate}`
  // Body is empy for GET
  const body = ''

  const requestConfig = {
    baseURL: baseURL,
    url: url,
    method: method,
    headers: getRequestHeaders(method, url, body, apiKey, secret),
  }

  const response = await requester.request<FundResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  if (
    !response.response.data ||
    !Array.isArray(response.response.data.Data) ||
    response.response.data.Data.length === 0
  ) {
    throw new AdapterError({
      statusCode: 400,
      message: `No fund found`,
    })
  }

  return response.response.data.Data
}
