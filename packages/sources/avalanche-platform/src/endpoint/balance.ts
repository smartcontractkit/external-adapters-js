import {
  Config,
  Validator,
  Requester,
  AdapterInputError,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['balance']

export const description =
  'The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof of Reserves adapter.'

enum Field {
  STAKE_AMOUNT = 'stakeAmount',
  POTENTIAL_REWARD = 'potentialReward',
}

export type TInputParameters = { addresses: Address[]; field: string }
export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
  field: {
    required: true,
    type: 'string',
    description: 'The field that should be returned in the results',
    options: Object.values(Field),
  },
}

type Address = {
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]
  const field = validator.validated.data.field

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  return await queryPlatformChain(jobRunID, config, addresses, field)
}

interface ResponseSchema {
  result: {
    validators: ValidatorState[]
  }
}

interface ValidatorState {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  weight: string
  validationRewardOwner: {
    locktime: string
    threshold: string
    addresses: string[]
  }
  delegationRewardOwner: {
    locktime: string
    threshold: string
    addresses: string[]
  }
  potentialReward: string
  delegationFee: string
  uptime: string
  connected: boolean
  signer: {
    publicKey: string
    proofOfPosession: string
  }
  delegators: Delegator[]
}

interface Delegator {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  rewardOwner: {
    locktime: string
    threshold: string
    addresses: string[]
  }
  potentialReward: string
}

interface BalanceResponse {
  address: string
  balance: string
}

const queryPlatformChain = async (
  jobRunID: string,
  config: Config,
  addresses: Address[],
  field: string,
) => {
  const options: AxiosRequestConfig = {
    ...config.api,
    method: 'POST',
    data: {
      jsonrpc: '2.0',
      method: 'platform.getCurrentValidators',
      params: { nodeIDs: addresses.map(({ address }) => address) },
      id: jobRunID,
    },
  }

  const response = await Requester.request<ResponseSchema>(options)
  const balances: BalanceResponse[] = []

  if (field === Field.STAKE_AMOUNT) {
    response.data.result.validators.forEach((validator) => {
      balances.push({ address: validator.nodeID, balance: validator.stakeAmount })
    })
  } else if (field === Field.POTENTIAL_REWARD) {
    const today = new Date().setHours(0, 0, 0, 0)
    response.data.result.validators.forEach((validator) => {
      // Filter result by endTime > today as per requirements
      // endTime is returned in seconds, convert to miliseconds before comparison
      if (new Date(Number(validator.endTime) * 1000).getTime() > today) {
        balances.push({ address: validator.nodeID, balance: validator.potentialReward })
      }
    })
  }

  const result = {
    data: {
      validators: response.data.result.validators,
      result: balances,
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}
