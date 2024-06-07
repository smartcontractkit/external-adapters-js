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
    key: {
      aliases: ['path'],
      required: true,
      type: 'string',
      description: 'The path of the file stored in S3',
    },
    row: {
      required: true,
      type: 'string',
      description: 'The row of the CSV file to query',
    },
    column: {
      required: true,
      type: 'string',
      description: 'The column of the row in the CSV file to return',
    },
  },
  [
    {
      bucket: 's3_bucket',
      key: 'path/to/file.csv',
      row: '100',
      column: 'AA',
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
  aliases: ['nav'], // TODO: remove or switch?
  transport: transport,
  inputParameters,
  overrides: overrides['s3reader'],
})
