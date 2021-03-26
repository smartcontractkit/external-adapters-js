import { Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import * as dxfeed from '@chainlink/dxfeed-adapter'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

const customParams = {
  base: ['base', 'from', 'coin', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const symbol = validator.overrideSymbol(AdapterName)
  request.data.base = symbol

  const exec = dxfeed.makeExecute(config)
  return exec(request)
}
