import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, AdapterResponse } from '@chainlink/types'
import { Config } from '../config'
import TeClient from 'tradingeconomics-stream'

export const NAME = 'markets'

const customParams = {
  base: ['base', 'from', 'asset'],
}

const commonSymbols: Record<string, string> = {
  N225: 'NKY:IND',
  FTSE: 'UKX:IND',
}

const _executeHTTP = async (jobRunID: any, symbol: string, config: Config) => {
  const url = `markets/symbol/${symbol}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data[0], ['Last'])

  return Requester.success(jobRunID, response, config.verbose)
}

const _executeWS = async (jobRunID: any, symbol: string, config: Config) =>
  new Promise<AdapterResponse>((resolve, reject) => {
    const client = new TeClient({
      url: 'ws://stream.tradingeconomics.com/',
      key: config.apiClientKey,
      secret: config.apiKey,
      reconnect: false,
    })

    client.subscribe(symbol)

    let completed = false

    client.on('message', (msg: any) => {
      client.ws.close()
      completed = true
      const response = {
        data: msg,
        status: 200,
      }
      response.data.result = Requester.validateResultNumber(response.data, ['price'])
      resolve(Requester.success(jobRunID, response, config.verbose))
    })

    // In case we don't get a response from the WS stream
    // within the WS_TIMEOUT, we do a check on the (possibly)
    // delayed HTTP(s) endpoint.
    const timeout = 1000
    const maxTries = config.wsTimeout / timeout
    let tries = 0
    const _checkTimeout = () => {
      if (completed) return

      if (tries++ > maxTries) {
        client.ws.close()
        reject('Websocket Timed Out')
      }

      setTimeout(_checkTimeout, timeout)
    }

    setTimeout(_checkTimeout, timeout)
  })

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (symbol in commonSymbols) {
    symbol = commonSymbols[symbol]
  }

  try {
    const ws = await _executeWS(jobRunID, symbol, config)
    if (ws) return ws
    throw new AdapterError({
      jobRunID,
      message: 'Websocket Timed Out',
      statusCode: 500,
    })
  } catch {
    return await _executeHTTP(jobRunID, symbol, config)
  }
}
