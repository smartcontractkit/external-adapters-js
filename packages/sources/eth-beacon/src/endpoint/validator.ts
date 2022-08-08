import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { StateId, ValidatorStatus } from '../types'

export const supportedEndpoints = ['validator']

export const endpointResultPaths = {
  validator: 'data.validator.effective_balance',
}

export interface ResponseSchema {
  data: {
    index: string // string representing a number
    balance: string // string representing a number
    status: ValidatorStatus
    validator: {
      pubkey: string // string representing an address
      withdrawal_credentials: string // string representing an address
      effective_balance: string // string representing a number
      slashed: boolean
      activation_eligibility_epoch: string // string representing a number
      activation_epoch: string // string representing a number
      exit_epoch: string // string representing a number
      withdrawable_epoch: string // string representing a number
    }
  }
  execution_optimistic: boolean
}

export const description =
  'Return state data for a specific validator.\nSee https://ethereum.github.io/beacon-APIs/#/Beacon/getStateValidator for more details.\nSupports v2.3.0.'

export type TInputParameters = { stateId: StateId; validatorId: string }
export const inputParameters: InputParameters<TInputParameters> = {
  stateId: {
    description: 'State identifier',
    options: [''],
    required: true,
  },
  validatorId: {
    description: 'Either hex encoded public key (any bytes48 with 0x prefix) or validator index',
    type: 'string',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const stateId = validator.validated.data.stateId
  const validatorId = validator.validated.data.validatorId
  const url = `/eth/v1/beacon/states/${stateId}/validators/${validatorId}`
  const resultPath = validator.validated.data.resultPath

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
