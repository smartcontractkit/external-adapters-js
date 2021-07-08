import { Execute } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'Finage'

const customParams = {
  base: ['base', 'from', 'symbol'],
  endpoint: false,
}

const baseUrl = 'https://api.finage.co.uk'

const DEFAULT_ENDPOINT = 'stock'

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()
  const apikey = util.getRandomRequiredEnv('API_KEY')
  let params
  let responsePath
  let url: string

  switch (endpoint) {
    case 'stock': {
      url = `${baseUrl}/last/stock/${symbol}`
      responsePath = ['bid']
      params = {
        apikey,
      }
      break
    }
    case 'eod': {
      url = `${baseUrl}/agg/stock/prev-close/${symbol}`
      responsePath = ['results', 0, 'c']
      params = {
        apikey,
      }
      break
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, responsePath)
  return Requester.success(jobRunID, response)
}
