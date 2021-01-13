import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'

const customError = (data: any) => {
  if (Object.keys(data).length < 1) return true
  if (!('health' in data) || !data.health) return true
  return false
}

const customParams = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)
  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = 'https://gasprice.poa.network/'
  try {
    const { data } = await Requester.request(url)
    data.result = Requester.validateResultNumber(data, [speed]) * 1e9
    return Requester.success(jobRunID, {
      data,
      result: data.result,
      status: 200,
    })
  } catch (err) {
    return Requester.errored(jobRunID, err.message)
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
