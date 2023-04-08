import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['yield', 'cryptoyield', 'crypto-yield']

export type TInputParameters = { poolCode: string }

export const inputParameters: InputParameters<TInputParameters> = {
  poolCode: {
    default: 'ethnetwork_eth',
    required: false,
    type: 'string',
    description: 'Tiingo staking pool code to return yield data for',
  },
}

interface CryptoYieldResponse {
  date: string
  yieldPoolID: number
  yieldPoolName: string
  epoch: number
  startSlot: number
  endSlot: number
  validatorReward: number
  transactionReward: number
  validatorSubtractions: number
  deposits: number
  totalReward: number
  divisor: number
  apr30Day: number
  apr90Day: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {})

  const jobRunID = validator.validated.id
  const poolCode = validator.validated.data.poolCode

  const reqConfig = {
    ...config.api,
    params: {
      poolCodes: poolCode,
      token: config.apiKey,
    },
    url: 'tiingo/crypto-yield/ticks',
  }

  const response = await Requester.request<CryptoYieldResponse[]>(reqConfig)
  let resultPath = validator.validated.data.resultPath?.toString()
  if (!resultPath) {
    resultPath = Object.keys(response.data[0]).includes('apr30Day') ? 'apr30Day' : 'supplyRate'
  }
  const result = Requester.validateResultNumber(response.data, [0, resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
