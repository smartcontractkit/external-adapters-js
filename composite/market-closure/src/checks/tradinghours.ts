import { Requester } from '@chainlink/external-adapter'
import { convertCommonKeys, ExternalCheck } from './index'

const commonKeys: Record<string, string> = {
  FTSE: 'xlon',
  N225: 'xjpx',
}

export const thExecute: ExternalCheck = async (symbol: string) => {
  const url = 'https://www.tradinghours.com/api/v2/status'

  const market = convertCommonKeys(symbol, commonKeys)
  const api_token = process.env.CHECK_API_KEY || process.env.TH_API_KEY

  const params = { market, api_token }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)

  return Requester.getResult(response.data, [market, 'status']).toLowerCase() !== 'open'
}
