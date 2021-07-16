import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'

const customParams = {
  symbol: ['symbol', 'base', 'asset', 'from'],
}

const commonKeys: Record<string, string> = {
  FTSE: 'xlon',
  N225: 'xjpx',
}

export const isMarketClosed = async (input: AdapterRequest): Promise<boolean> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const symbol = validator.validated.data.symbol
  const url = 'https://www.tradinghours.com/api/v2/status'
  const market = commonKeys[symbol] || symbol
  const api_token = process.env.CHECK_API_KEY || process.env.TH_API_KEY

  const params = { market, api_token }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  const status = (Requester.getResult(response.data, [market, 'status']) as string).toLowerCase()
  return status !== 'open'
}
