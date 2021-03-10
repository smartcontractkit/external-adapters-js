import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'dns-proof'

const customParams = {
  domain: true,
  address: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const domain = validator.validated.data.domain
  const address = validator.validated.data.address
  const url = `resolve`

  const params = {
    name: domain,
    type: 'TXT',
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options)
  const result = response.data.Answer?.find(
    (entry: { data: string }) => entry.data.slice(1, 43) === address,
  )
    ? true
    : false

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
