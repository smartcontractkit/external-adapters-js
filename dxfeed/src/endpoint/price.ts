import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

const DEMO_ENDPOINT = 'https://tools.dxfeed.com/webservice/rest'
const DEFAULT_DATA_ENDPOINT = 'events.json'

export const NAME = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'market'],
}

const commonSymbols: { [key: string]: string } = {
  N225: 'NKY.IND:TEI',
  FTSE: 'UKX.IND:TEI',
  TSLA: 'TSLA:BFX',
  WTI: 'USO/USD:AFX',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const username = process.env.API_USERNAME
  const password = process.env.API_PASSWORD

  const apiEndpoint = process.env.API_ENDPOINT || DEMO_ENDPOINT
  if (apiEndpoint === DEMO_ENDPOINT)
    console.warn(`Using demo endpoint: ${DEMO_ENDPOINT} (Please do not use in production!)`)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_DATA_ENDPOINT
  const url = `${apiEndpoint}/${endpoint}`
  let symbols = validator.validated.data.base.toUpperCase()
  if (symbols in commonSymbols) {
    symbols = commonSymbols[symbols]
  }

  const params = {
    events: 'Trade',
    symbols,
  }

  const options = {
    ...config.api,
    url,
    params,
    auth: { username, password },
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, ['Trade', symbols, 'price'])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
