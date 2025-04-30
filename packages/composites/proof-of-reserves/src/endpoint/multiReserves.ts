import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import type { TInputParameters as SingleTInputParameters } from './reserves'
import { execute as singleExecute } from './reserves'

export const supportedEndpoints = ['multiReserves']

export type TInputParameters = {
  input: SingleTInputParameters[]
  outputDecimals: number
}

const inputParameters: InputParameters<TInputParameters> = {
  input: {
    required: true,
    type: 'array',
    description: 'An array of PoR request, each request is a request to the reserves endpoint',
  },
  outputDecimals: {
    required: false,
    type: 'number',
    default: 18,
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const providerDataRequestedUnixMs = Date.now()

  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id
  const outputDecimals = validator.validated.data.outputDecimals

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
        // Scaling everything up to 18 to preserve precision
        return scale(BigInt(result.result.toString()), {
          valueDecimal: result.data.decimals?.toString(),
          targetDecimal: 18,
        })
      }
    })
    .reduce((s, e) => s + e)

  // Possible for result to aggregate multiple values > outputDecimals from the separate singleExecutes
  // Therefore, we scale everything to 18 and then down to outputDecimals, which should preserve
  // more precision by performing possible division last
  const scaledResult = scale(result, {
    valueDecimal: '18',
    targetDecimal: outputDecimals,
  }).toString()

  return {
    jobRunID,
    result: scaledResult,
    statusCode: 200,
    data: {
      result: scaledResult,
      details: results.map((r) => JSON.stringify(r.data)).toString(),
      statusCode: 200,
      decimals: outputDecimals,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
      },
    },
  }
}

// Scale value with valueDecimal to targetDecimal (default 18)
const scale = (value: bigint, decimals: { valueDecimal?: string; targetDecimal: number }) => {
  const { valueDecimal, targetDecimal } = decimals
  if (valueDecimal) {
    if (targetDecimal >= Number(valueDecimal)) {
      return value * 10n ** (BigInt(targetDecimal) - BigInt(valueDecimal))
    } else {
      // NOTE: this condition can lead to precision loss
      return value / 10n ** (BigInt(valueDecimal) - BigInt(targetDecimal))
    }
  } else {
    return value
  }
}
