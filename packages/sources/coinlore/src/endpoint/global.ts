import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'global'

const customParams = {
  base: false,
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `${NAME}`
  const symbol = validator.validated.data.base || 'btc'
  let field = validator.validated.data.field || 'd'
  if (field === 'd') field = `${symbol.toLowerCase()}_d`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data[0], [field])
  return Requester.success(jobRunID, response, config.verbose)
}
