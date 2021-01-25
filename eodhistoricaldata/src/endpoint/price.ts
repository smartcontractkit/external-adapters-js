import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
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

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
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

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, ['close'])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
