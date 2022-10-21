import { AxiosResponse, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { COINS } from '../config'

export const supportedEndpoints = ['stats', 'height', 'difficulty']

export const endpointResultPaths = {
  stats: 'stats',
  height: 'blocks',
  difficulty: 'difficulty',
}

export type TInputParameters = { blockchain: string }
export const inputParameters: InputParameters<TInputParameters> = {
  blockchain: {
    aliases: ['coin'],
    description: '',
    type: 'string',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = (validator.validated.data.resultPath || '').toString()

  const blockchain = Requester.toVendorName(
    validator.validated.data.blockchain.toLowerCase(),
    COINS,
  )
  const url = util.buildUrlPath(`/:blockchain/stats`, { blockchain })

  const reqConfig = { ...config.api, url }

  const response: AxiosResponse = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', resultPath])
  return Requester.success(jobRunID, response)
}
