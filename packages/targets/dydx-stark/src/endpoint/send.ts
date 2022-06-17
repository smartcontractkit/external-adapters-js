import {
  AxiosRequestConfig,
  AxiosResponse,
  ExecuteWithConfig,
  InputParameters,
  objectPath,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, DEFAULT_DATA_PATH } from '../config'
import { PriceDataPoint, requireNormalizedPrice, getPricePayload } from './starkex'

export const NAME = 'send'

export type TInputParameters = { dataPath: string; asset: string }
export const customParams: InputParameters<TInputParameters> = {
  dataPath: {
    description: 'Optional path where to find the price data, defaults to `result`',
    type: 'string',
    required: false,
  },
  asset: {
    description: 'Required asset name (of your choice, per asset. for example "BTCUSD")',
    type: 'string',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const { asset, ...data } = validator.validated.data

  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  let price = <number | string>objectPath.get(data, dataPath)

  /* Remove me May 10th 2021 */
  if (!price) price = <number | string>objectPath.get(request, dataPath)
  /**************************/

  const priceData: PriceDataPoint = {
    oracleName: config.oracleName,
    assetName: asset,
    // Get the current timestamp in seconds
    timestamp: Math.floor(Date.now() / 1000),
    price: requireNormalizedPrice(price),
  }
  const payload = await getPricePayload(config.privateKey, config.starkMessage, priceData)

  Logger.debug('Sending payload: ', { payload })

  const options: AxiosRequestConfig = {
    ...config.api,
    url: '',
    method: 'POST',
    data: payload,
  }

  const response: AxiosResponse = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
