import { AdapterInputError, objectPath, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['balances']

export const endpointResultPaths = {
  balances: 'availableBalance',
}

export interface ResponseSchema {
  number: string // '9000000003481'
  name: string // '*Checking Account*'
  type: string // 'SAVINGS'
  balance: number // 24681.55
  availableBalance: number // 24681.55
  active: boolean // true
  currencyCode: string // 'USD'
}

export const description =
  "Cash and equivalent balances for Fluent Finance US Plus' reserve accounts"

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `balances`
  const resultPath = validator.validated.data.resultPath || ''

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema[]>(options)

  // The API response is an array of bank accounts, so this is reduced to a single value
  const reducedResult = response.data.reduce((accumulator, current) => {
    const currentResult = objectPath.get(current, resultPath)
    if (Number.isNaN(currentResult))
      throw new AdapterInputError({
        statusCode: 400,
        message: `The value given by the resultPath of ${resultPath} is not a number. Since the result is reduced it can only return number values. If this resultPath previously worked, then the data provider API may have changed.`,
      })
    return accumulator + currentResult
  }, 0)

  return Requester.success(jobRunID, Requester.withResult(response, reducedResult), config.verbose)
}
