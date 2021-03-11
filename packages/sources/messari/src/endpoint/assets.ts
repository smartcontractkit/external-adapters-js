import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'assets'

const customError = (data: any) => {
  if (data.Response === 'Error') return true
  return false
}

const customParams = {
  base: ['base', 'market', 'to', 'quote'],
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const field = validator.validated.data.field || 'marketcap.marketcap_dominance_percent'
  const url = `assets/${base}/metrics`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, ['data', ...field.split('.')])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
