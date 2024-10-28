import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getValidatorIds } from './authentication'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
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
  url: string,
  apiKey: string,
  secret: string,
  requester: Requester,
) => {
  const method = 'GET'
  const path = '/navapigateway/api/v1/ClientMasterData/GetFundList'
  const requestConfig = {
    baseURL: url,
    url: path,
    method: method,
    headers: getValidatorIds(method, path, '', apiKey, secret),
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

  return [response.GlobalFundID.toString(), response.FundDailyAccountingLastAvailableDate + 'Z']
}
