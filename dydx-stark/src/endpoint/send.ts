import BN from 'bn.js'
import objectPath from 'object-path'
import { ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator, AdapterError, logger } from '@chainlink/external-adapter'
import { Config, DEFAULT_DATA_PATH } from '../config'
import { PriceDataPoint, getPricePayload } from './starkex'

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
  const price = <number>objectPath.get(data, dataPath)
  // Check if input data is valid
  if (isNaN(price)) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a number. Got: ${price}`,
      statusCode: 400,
    })
  }

  const priceData: PriceDataPoint = {
    oracleName: config.oracleName,
    assetPair: asset,
    // Get the current timestamp in seconds
    timestamp: Math.floor(Date.now() / 1000),
    price: new BN(price),
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
