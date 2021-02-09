import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config, endpoints) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || config.DEFAULT_ENDPOINT
  if (endpoints) {
    for (const e of endpoints) {
      if (e.Names.includes(endpoint)) {
        if (e.execute) {
          return await e.execute(request, config)
        }
        return await e.makeExecute(config)(request)
      }
    }
    throw new AdapterError({
      jobRunID,
      message: `Endpoint ${endpoint} not supported.`,
      statusCode: 400,
    })
  }
  throw new AdapterError({
    jobRunID,
    message: `Endpoints not available for this adapter.`,
    statusCode: 500,
  })
}

// export const makeExecute: ExecuteFactory<Config> = (config) => {
//   return async (request) => execute(request, config, endpoints)
// }
