import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig, logConfig, DEFAULT_ENDPOINT } from './config'
import { balance } from './endpoint'

export type JobSpecRequest = {
  id: string
  data: Record<string, unknown>
}
type Callback = (statusCode: number, data: Record<string, unknown>) => void

const inputParams = {
  endpoint: false,
}

const config: Config = getConfig()
logConfig(config)

// Export function to integrate with Chainlink node
export const execute = (request: JobSpecRequest, callback: Callback): void => {
  const validator = new Validator(request, inputParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id

  const _handleResponse = (out: any): void => {
    callback(
      200,
      Requester.success(jobRunID, {
        data: { result: out },
        result: out,
        status: 200,
      }),
    )
  }

  const _handleError = (err: Error): void => callback(500, Requester.errored(jobRunID, err.message))

  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let fn
  switch (endpoint) {
    case balance.Name: {
      const validator = new Validator(request, balance.inputParams)
      if (validator.error) return callback(validator.error.statusCode, validator.error)

      fn = balance.execute(config, request, validator.validated.data)
      break
    }
    default: {
      fn = Promise.reject(Error(`Endpoint ${endpoint} not supported.`))
      break
    }
  }

  fn.then(_handleResponse).catch(_handleError)
}
