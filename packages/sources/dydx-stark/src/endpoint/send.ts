import objectPath from 'object-path'
import { ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, DEFAULT_DATA_PATH } from '../config'
import { PriceDataPoint, requireNormalizedPrice, getPricePayload } from './starkex'

export const NAME = 'send'

const customParams = {
  dataPath: false,
  result: false,
  asset: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { asset, ...data } = validator.validated.data

  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const price = <number | string>objectPath.get(data, dataPath)

  const priceData: PriceDataPoint = {
    oracleName: config.oracleName,
    assetName: asset,
    // Get the current timestamp in seconds
    timestamp: Math.floor(Date.now() / 1000),
    price: requireNormalizedPrice(price),
  }
  const payload = await getPricePayload(config.privateKey, config.starkMessage, priceData)

  Logger.debug('Sending payload: ', { payload })

  const options = {
    ...config.api,
    url: '',
    method: 'POST' as any,
    data: payload,
  }

  const response = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
