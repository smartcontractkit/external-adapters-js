import objectPath from 'object-path'
import { ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator, logger } from '@chainlink/external-adapter'
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
    price: requireNormalizedPrice(jobRunID, price),
  }
  const payload = await getPricePayload(config.privateKey, config.starkMessage, priceData)

  logger.debug('Sending payload: ', { payload })

  const options = {
    ...config.api,
    url: '',
    method: 'POST',
    data: payload,
  }

  const response = await Requester.request(options)
  const result = response.data

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
