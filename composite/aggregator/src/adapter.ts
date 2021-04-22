import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'
import { Requester } from '@chainlink/external-adapter'
import { makeConfig, Config, DEFAULT_DATA_PATH, DEFAULT_REDUCER } from './config'

const customParams = {
  reducer: false,
}

const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const id = validator.validated.id
  const reducer = validator.validated.reducer || DEFAULT_REDUCER
  const data = input // passing unvalidated data to directly to EAs for validation (allows for this composite to handle more general cases)
  const aggregateData: number[] = []
  const dataProviders = Object.keys(config.endpoints)

  // fetch data from existing EAs according to environment parameters
  for (let i = 0; i < dataProviders.length; i++) {
    const options = {
      ...config.api,
      data,
      baseURL: config.endpoints[dataProviders[i]],
      method: 'POST',
    }

    const response = await Requester.request(options)
    const resultPath: string[] = config?.customPaths?.[dataProviders[i]] || [DEFAULT_DATA_PATH] //paths for pulling data from EA response
    const result = Requester.validateResultNumber(response.data, resultPath)
    aggregateData.push(result)
  }

  // passing data to reduce EA
  const reduceOptions = {
    method: 'POST',
    data: {
      id,
      data: {
        result: aggregateData,
        reducer,
      },
    },
    baseURL: config.reduce,
  }
  const response = await Requester.request(reduceOptions)

  // return data with individual responses from each EA
  return Requester.success(id, {
    ...response,
    data: {
      result: response.data.result,
      providers:  dataProviders.reduce((obj, key, index) => ({ ...obj, [key.toLowerCase()]: aggregateData[index] }), {})
    }
  }, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input) =>
  execute(input, config || makeConfig())
