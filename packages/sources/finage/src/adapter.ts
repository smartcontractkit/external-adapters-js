import { ExecuteWithConfig, ExecuteFactory, Config} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'

const customParams = {
  base: ['base', 'from', 'symbol'],
  to: false,
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || ''
  let url = `${config.api.baseURL}/last/${endpoint}`
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()
  console.log(symbol)
  const to = (validator.validated.data.to || '').toUpperCase()
  const currencies = symbol + to
  const apikey = util.getRandomRequiredEnv('API_KEY')
  let params
  let responsePath

  switch (endpoint) {
    case 'stock': {
      url = `${url}/${symbol}`
      responsePath = ['bid']
      params = {
        apikey,
      }
      break
    }
    case 'eod': {
      url = `${config.api.baseURL}/agg/stock/prev-close/${symbol}`
      responsePath = ['results', 0, 'c']
      params = {
        apikey,
      }
      break
    }
    default: {
      responsePath = ['currencies', 0, 'value']
      params = {
        currencies,
        apikey,
      }
      break
    }
  }

  const options = {
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, responsePath)
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
