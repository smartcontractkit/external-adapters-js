import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

/**
 * Shared input parameter definitions used across all data-engine endpoints.
 */
export const commonInputParams = {
  feedId: {
    required: true,
    type: 'string',
    description: 'The feed ID to subscribe to',
  },
  resultPath: {
    required: false,
    type: 'string',
    description: 'The data field to populate the top-level result',
  },
  decimals: {
    required: false,
    type: 'number',
    description: 'Number of decimals to scale the resultPath value to (from native 18)',
  },
  returnAs: {
    required: false,
    type: 'string',
    description:
      'Output format: "truncated" (integer, default) or "float". Can be used when `decimals` is present.',
    options: ['truncated', 'float'],
  },
} as const

/**
 * Shared validation function to ensure returnAs is only provided with decimals
 */
export function validateReturnAsParam(
  req: AdapterRequest<TypeFromDefinition<typeof commonInputParams>>,
): AdapterInputError | undefined {
  if (req.requestContext.data.returnAs && req.requestContext.data.decimals === undefined) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'returnAs input param must be paired with a decimals value',
    })
  }
  return
}
