import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

/**
 * @swagger
 * endpoints:
 *  price:
 *    properties:
 *      - coinid
 *      - base
 *      - from
 *      - coin
 *      - quote
 *      - to
 *      - market
 *    required:
 *      - oneOf:
 *        - coinid
 *        - oneOf:
 *            - base
 *            - from
 *            - coin
 *      - oneOf:
 *        - quote
 *        - to
 *        - market
 */

 /**
  * @swagger
  * endpoints:
  *  price:
  *    properties:
  *      - coinid
  *      - base
  *      - from
  *      - coin
  *      - quote
  *      - to
  *      - market
  *    required:
  *      - oneOf:
  *        - coinid
  *        - oneOf:
  *            - base
  *            - from
  *            - coin
  *      - oneOf:
  *        - quote
  *        - to
  *        - market
  */

export const NAME = 'price'

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
}

const getCoinId = async (config: Config, symbol: string): Promise<string> => {
  const url = '/coins/list'

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const coin = response.data.find((x: any) => x.symbol.toLowerCase() === symbol.toLowerCase())

  if (typeof coin === 'undefined') {
    throw new Error('Coin id not found')
  }

  return coin.id.toLowerCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid?.toLowerCase() || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    try {
      coin = await getCoinId(config, symbol)
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = '/simple/price'
  const path: string = validator.validated.data.path || Paths.Price

  const params = {
    ids: coin,
    vs_currencies: quote,
    include_market_cap: path === Paths.MarketCap,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const param: { [key: string]: string } = {
    [Paths.MarketCap]: `${quote.toLowerCase()}_market_cap`,
    [Paths.Price]: `${quote.toLowerCase()}`,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [
    coin.toLowerCase(),
    param[path] || quote.toLowerCase(),
  ])
  return Requester.success(jobRunID, response, config.verbose)
}
