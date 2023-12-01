import { AdapterInputError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { getTotalAllocations, TALegacyConfig } from '@chainlink/token-allocation-test-adapter'
import { Config } from '../config'

export const supportedEndpoints = ['allocation']

export type TInputParameters = {
  source: string
}

const inputParameters: InputParameters<TInputParameters> = {
  source: {
    required: true,
  },
}

export const getSymbols = async (): Promise<Array<{ symbol: string }>> => {
  const symbols = await import(`../symbols/symbols.json`)
  return symbols.default
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config: Config) => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id
  const source = validator.validated.data.source.toLowerCase()
  const sourceUrl = config[source as keyof TALegacyConfig]
  if (!sourceUrl) {
    throw new AdapterInputError({
      message: `Missing ${source.toUpperCase()}_ADAPTER_URL.`,
      statusCode: 400,
    })
  }
  const allocations = await getSymbols()
  const response = await getTotalAllocations({
    allocations,
    sourceUrl,
  })
  return Requester.success(
    jobRunID,
    {
      status: 200,
      data: response,
    },
    true,
  )
}
