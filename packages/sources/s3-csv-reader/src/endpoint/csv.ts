import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/csv'

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
        'The path prefix of the file stored in S3. <Date.csv> is appended to search for older files.',
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
  },
  [
    {
      bucket: 's3_bucket',
      keyPrefix: 'path/to/file',
      headerRow: 2,
      matcherColumn: 'matcherColumn',
      matcherValue: 'value',
      resultColumn: 'resultColumn',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'csv',
  transport: transport,
  inputParameters,
  overrides: overrides['s3-csv-reader'],
})
