import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'asset', 'from', 'symbol'],
  endpoint: false,
}

const commonKeys: { [key: string]: string } = {
  N225: 'N225.INDX',
  FTSE: 'FTSE.INDX',
  BZ: 'BZ.COMM',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint || 'real-time'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://eodhistoricaldata.com/api/${endpoint}/${symbol}`
  const api_token = util.getRandomRequiredEnv('API_KEY')

  const params = {
    api_token,
    fmt: 'json',
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)
  return Requester.validateResultNumber(response.data, ['close'])
}
