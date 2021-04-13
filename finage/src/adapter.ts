import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'Finage'

const customParams = {
  base: ['base', 'from', 'symbol'],
  to: false,
  endpoint: false,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || ''
  let url = `https://api.finage.co.uk/last/${endpoint}`
  const symbol = validator.overrideSymbol(NAME).toUpperCase()
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
    default: {
      responsePath = ['currencies', 0, 'value']
      params = {
        currencies,
        apikey,
      }
      break
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
