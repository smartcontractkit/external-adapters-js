import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['getgrambalances']

export type ResponseSchema = {
  VaultID: string
  MetalCode: string
  CustodianID: string
  UtilizationLockCode: string
  EntityID: string
  ItemCategoryCode: string
  NrParcels: number
  PureGrams: number
  GrossGrams: number
  FixedValuation: number
  AsOfUTC: string
  MetalName: string
  CategoryName: string
  ParcelGrouping: string
  Valuation: number
}[]

export const inputParameters: InputParameters = {
  custodianID: {
    required: false,
    type: 'string',
    default: 'Cache',
  },
  metalCode: {
    required: false,
    type: 'string',
    default: 'AU',
  },
  utilizationLockCode: {
    required: false,
    type: 'string',
    default: 'Locked',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const custodianID = validator.validated.data.custodianID
  const metalCode = validator.validated.data.metalCode
  const utilizationLockCode = validator.validated.data.utilizationLockCode
  const url = `/getgrambalances`

  const params = {
    custodianID,
    metalCode,
    utilizationLockCode,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = response.data.reduce((sum, item) => sum + item.PureGrams, 0)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
