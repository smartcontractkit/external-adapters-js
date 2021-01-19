import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'

export const NAME = 'example'

const customParams = {
  path: true,
  result: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const path = validator.validated.data.path
  const resultPath = validator.validated.data.result || 'avg'

  const auth = {
    username: config.apiKey,
  }

  const reqConfig = { ...config.api, auth, url: `collections/${config.projectId}/s/${path}` }

  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
