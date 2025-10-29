import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRequestHeaders } from './authentication'

export interface FundDatesResponse {
  LogID: number
  FromDate: string
  ToDate: string
}

export const getFundDates = async ({
  globalFundID,
  baseURL,
  apiKey,
  secret,
  requester,
}: {
  globalFundID: number
  baseURL: string
  apiKey: string
  secret: string
  requester: Requester
}): Promise<FundDatesResponse> => {
  const method = 'GET'
  const url = `/navapigateway/api/v1/ClientMasterData/GetAccountingDataDates?globalFundID=${globalFundID}`
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

  const sourceResponse = await requester.request<FundDatesResponse>(
    JSON.stringify(requestConfig),
    requestConfig,
  )
  if (!sourceResponse.response.data) {
    throw new AdapterError({
      statusCode: 400,
      message: `No fund found`,
    })
  }

  return sourceResponse.response.data
}
