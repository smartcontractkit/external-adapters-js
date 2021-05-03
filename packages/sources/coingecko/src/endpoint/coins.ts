import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'coins'

export type CoinsResponse = { id: string; symbol: string; name: string }[]

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

const customParams = {}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/coins/list'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request<CoinsResponse>(options, customError)
  return Requester.success(jobRunID, response, true)
}
