import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import type { TInputParameters as SingleTInputParameters } from './reserves'
import { execute as singleExecute } from './reserves'
import { Validator } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { AdapterError } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['multiReserves']

export type TInputParameters = {
  input: SingleTInputParameters[]
}

const inputParameters: InputParameters<TInputParameters> = {
  input: {
    required: true,
    type: 'array',
    description: 'An array of PoR request, each request is a request to the reserves endpoint',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const providerDataRequestedUnixMs = Date.now()

  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id

  const results = await Promise.all(
    validator.validated.data.input.map((input) =>
      singleExecute(
        {
          id: jobRunID,
          data: input,
        },
        context,
        config,
      ),
    ),
  )

  const result = results
    .map((result) => {
      if (result.statusCode != 200 || !result.result) {
        throw new AdapterError({
          ...result,
        })
      } else {
        return scale(BigInt(result.result.toString()), result.data.decimals?.toString())
      }
    })
    .reduce((s, e) => s + e)
    .toString()

  return {
    jobRunID,
    result: result,
    statusCode: 200,
    data: {
      result: result,
      statusCode: 200,
      decimals: 18,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
      },
    },
  }
}

const scale = (value: bigint, decimal?: string) => {
  if (decimal) {
    // Scale to 18 decimals
    return value * 10n ** (18n - BigInt(decimal))
  } else {
    return value
  }
}
