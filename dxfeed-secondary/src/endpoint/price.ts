import { Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import * as dxfeed from '@chainlink/dxfeed-adapter'

export const NAME = 'price'

const customParams = {
  base: ['base', 'from', 'coin'],
}

const commonSymbols: { [key: string]: string } = {
  N225: 'NKY.IND:TEI',
  FTSE: 'UKX.IND:TEI',
  TSLA: 'TSLA.US:TEI',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  let symbol = validator.validated.data.base.toUpperCase()
  if (symbol in commonSymbols) {
    symbol = commonSymbols[symbol]
  }
  request.data.base = symbol

  const exec = dxfeed.makeExecute(config)
  return exec(request)
}
