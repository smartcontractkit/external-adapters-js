import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'

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
  const url = `/api/${endpoint}/${symbol}`

  const params = {
    ...config.api.params,
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
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
