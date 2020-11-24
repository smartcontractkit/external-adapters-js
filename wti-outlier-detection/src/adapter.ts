import { AdapterResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { fetchXbto } from './xbto'
import { fetchOilpriceapi } from './oilpriceapi'
import { getLatestAnswer } from '@chainlink/reference-data-reader'

const oilpriceapiThreshold = process.env.DIFF_OILPRICEAPI_THRESHOLD || 10

export type ExternalFetch = () => Promise<number>

const difference = (a: number, b: number): number => {
  return (Math.abs(a - b) / ((a + b) / 2)) * 100
}

const customParams = {
  contract: ['referenceContract', 'contract'],
  multiply: true,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply

  const result = await fetchXbto()

  const oilpriceapi = await fetchOilpriceapi()
  if (difference(result, oilpriceapi) > oilpriceapiThreshold) {
    const onChainValue = await getLatestAnswer(contract, multiply, input.meta)
    return returnValue(jobRunID, onChainValue)
  }

  return returnValue(jobRunID, result)
}

const returnValue = (jobRunID: string, result: number): AdapterResponse => {
  const response = { data: { result }, result, status: 200 }
  return Requester.success(jobRunID, response)
}
