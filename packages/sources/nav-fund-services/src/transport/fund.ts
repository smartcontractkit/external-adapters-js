import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRequestHeaders } from './authentication'

export const ACCOUNTING_DATE_KEY = 'Accounting Date'
export const NAV_PER_SHARE_KEY = 'NAV Per Share'
export const NEXT_NAV_PRICE_KEY = 'Next NAV Price'

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
    [NAV_PER_SHARE_KEY]: number
    [NEXT_NAV_PRICE_KEY]: number
    [ACCOUNTING_DATE_KEY]: string
    'Ending Balance': number
  }[]
}

export const getFund = async ({
  globalFundID,
  fromDate,
  toDate,
  baseURL,
  apiKey,
  secret,
  requester,
}: {
  globalFundID: number
  fromDate: string
  toDate: string
  baseURL: string
  apiKey: string
  secret: string
  requester: Requester
}): Promise<FundResponse['Data']> => {
  const method = 'GET'
  const url = `/navapigateway/api/v1/FundAccountingData/GetOfficialNAVAndPerformanceReturnsForFund?globalFundID=${globalFundID}&fromDate=${fromDate}&toDate=${toDate}`

  const requestConfig = {
    baseURL: baseURL,
    url: url,
    method: method,
    headers: getRequestHeaders({
      method: method,
      path: url,
      body: '',
      apiKey: apiKey,
      secret: secret,
    }),
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
