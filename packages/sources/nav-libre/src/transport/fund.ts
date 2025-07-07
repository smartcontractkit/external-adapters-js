import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRequestHeaders } from './authentication'
interface Response {
  FundName: string
  GlobalFundID: number
  FundEndDate: string
  FundDailyAccountingStartDate: string
  FundDailyAccountingLastAvailableDate: string
  FundOfficialAccountingLastAvailableDate: string
  PortfolioLastAvailableDate: string
}

export const getFund = async (
  globalFundID: number,
  url: string,
  apiKey: string,
  secret: string,
  requester: Requester,
) => {
  const method = 'GET'
  const query = `globalFundID=${globalFundID}`
  const path = '/navapigateway/api/v1/FundAccountingData/GetAccountingDataDates'
  const requestConfig = {
    baseURL: url,
    url: path,
    method: method,
    headers: getRequestHeaders(method, path + '?' + query, '', apiKey, secret),
  }

  const sourceResponse = await requester.request<Response[]>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  if (sourceResponse.response.data.length == 0) {
    throw new AdapterError({
      statusCode: 400,
      message: `No fund found`,
    })
  }

  const response = sourceResponse.response.data[0]
  console.log(response)

  return [response.GlobalFundID.toString(), response.FundDailyAccountingLastAvailableDate + 'Z']
}
