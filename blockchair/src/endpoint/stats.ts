import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { COINS } from '.'
import { DEFAULT_ENDPOINT } from '../config'

export const Name = 'stats'

const inputParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
}

const convertEndpoint: { [key: string]: string } = {
  height: 'blocks',
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  let endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]

  const blockchain = Requester.toVendorName(
    validator.validated.data.blockchain.toLowerCase(),
    COINS,
  )
  const url = `/${blockchain}/stats`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', endpoint])
  return Requester.success(jobRunID, response)
}
