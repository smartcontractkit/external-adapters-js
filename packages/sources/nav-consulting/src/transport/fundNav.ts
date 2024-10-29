import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getValidatorIds } from './authentication'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { format } from 'date-fns'
import { utc } from '@date-fns/utc'

interface Response {
  Data: {
    Date: string
    'Ending Net Asset Value': {
      DTD: number
    }
  }[]
}

const getDateString = (raw: string) => format(new Date(raw), 'MM-dd-yyyy', { in: utc })

export const getFundNav = async (
  globalFundID: string,
  date: string,
  url: string,
  apiKey: string,
  secret: string,
  requester: Requester,
) => {
  const dateStr = getDateString(date)
  const method = 'GET'
  const path = `/navapigateway/api/v1/FundAccountingData/GetBalanceSheetForFund?globalFundID=${globalFundID}&fromDate=${dateStr}&toDate=${dateStr}`
  const requestConfig = {
    baseURL: url,
    url: path,
    method: method,
    headers: getValidatorIds(method, path, '', apiKey, secret),
  }

  const sourceResponse = await requester.request<Response>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  try {
    return sourceResponse.response.data.Data[0]['Ending Net Asset Value'].DTD
  } catch (error) {
    throw new AdapterError({
      statusCode: 400,
      message: `No data for fund ${globalFundID} and date ${dateStr}`,
    })
  }
}
