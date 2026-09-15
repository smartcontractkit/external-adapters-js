import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRequestHeaders } from './authentication'
import { toDateString } from './date-utils'
import { getFundList } from './fund'

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

export const getFundOfficialAccountingLastAvailableDate = async ({
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
}): Promise<string> => {
  const fundList = await getFundList({
    baseURL,
    apiKey,
    secret,
    requester,
  })

  const fund = fundList.find((f) => f.GlobalFundID === globalFundID)

  if (!fund) {
    throw new AdapterError({
      statusCode: 400,
      message: `No fund found in fund list`,
    })
  }

  return toDateString(new Date(`${fund.FundOfficialAccountingLastAvailableDate}Z`))
}
