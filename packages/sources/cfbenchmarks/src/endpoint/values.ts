import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME } from '../config'

export const supportedEndpoints = ['values', 'crypto', 'price']

export const inputParameters: InputParameters = {
  index: true,
}

interface PayloadValue {
  value: string
  time: number
}

export interface ResponseSchema {
  payload: PayloadValue[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const id = validator.overrideSymbol(NAME, validator.validated.data.index)
  const url = `/v1/values`

  const params = {
    id,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig)

  const values = response.data.payload.sort((a, b) => {
    if (a.time < b.time) return 1
    if (a.time > b.time) return -1
    return 0
  })

  const result = Requester.validateResultNumber(values, [0, 'value'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
