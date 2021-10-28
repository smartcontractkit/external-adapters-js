import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['filtered']

export const endpointResultPaths = {
  filtered: 'price',
}

const customError = (data: any) => {
  return Object.keys(data).length === 0
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'id'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const symbol = validator.overrideSymbol(AdapterName)
  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const exchanges = `
    binance,binance_us,bitfinex,bitflyer,
    bithumb,bitstamp,bittrex,bkex,btcturk,
    cex,citex,gdax,coincheck,coinex,
    coinflex,coinone,cryptocom,etorox,ftx,
    gemini,hitbtc,itbit,korbit,kraken,
    kucoin,lbank,okcoinusd,okex,poloniex,
    tokok,trade_ogre`

  const url = `/prices/restricted`

  const params = {
    currency: symbol,
    key: config.apiKey,
    exchanges: exchanges,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)

  const result = Requester.validateResultNumber(response.data, resultPath)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
