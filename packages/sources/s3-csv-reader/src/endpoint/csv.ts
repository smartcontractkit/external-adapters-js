import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/csv'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { isValidBucket, isValidKeyPrefix } from '../transport/s3utils'

export const inputParameters = new InputParameters(
  {
    bucket: {
      required: true,
      type: 'string',
      description: 'The S3 bucket to query',
    },
    keyPrefix: {
      aliases: ['pathPrefix'],
      required: true,
      type: 'string',
      description:
        "The path prefix of the file stored in S3. Will be prefixed onto <DATE>.csv to search for older files, e.g. 'path/prefix-01-02-2024.csv'.",
    },
    headerRow: {
      required: true,
      type: 'number',
      description: 'The 1-indexed row of the CSV file that contains the column headers',
    },
    matcherColumn: {
      required: true,
      type: 'string',
      description: 'The column field to compare with the matcherValue',
    },
    matcherValue: {
      required: true,
      type: 'string',
      description: 'The value to match with matcherField',
    },
    resultColumn: {
      required: true,
      type: 'string',
      description:
        'The column of the CSV file to return a result for, where the row value for matcherColumn is equal to matcherValue',
    },
    delimiter: {
      required: false,
      type: 'string',
      default: ',',
      description: 'The delimiter used for the CSV file',
    },
  },
  [
    {
      bucket: 's3-bucket',
      keyPrefix: 'path/to/file',
      headerRow: 2,
      matcherColumn: 'matcherColumn',
      matcherValue: 'value',
      resultColumn: 'resultColumn',
      delimiter: ',',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export function customInputValidation(
  req: AdapterRequest<typeof inputParameters.validated>,
): AdapterError | undefined {
  const { bucket, keyPrefix } = req.requestContext.data

  if (!isValidBucket(bucket)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: bucket contains invalid input characters`,
    })
  }

  // all chars in the string must match one in KEY_PREFIX_REGEX
  if (!isValidKeyPrefix(keyPrefix)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: keyPrefix contains invalid input characters`,
    })
  }
  return
}

export const endpoint = new AdapterEndpoint({
  name: 'csv',
  transport: transport,
  inputParameters,
  customInputValidation,
  overrides: overrides['s3-csv-reader'],
})
