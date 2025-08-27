import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { sftpTransport } from '../transport/sftp'

export const inputParameters = new InputParameters(
  {
    operation: {
      required: true,
      type: 'string',
      description: 'SFTP operation to perform: list files, download file, or upload file',
    },
    remotePath: {
      required: true,
      type: 'string',
      description: 'Remote path on the SFTP server (defaults to root /)',
    },
    instrument: {
      required: true,
      type: 'string',
      description: 'Name of the file for download or upload operations',
    },
  },
  [
    {
      operation: 'download',
      remotePath: '/data/valuation/uk_all_share/',
      instrument: 'FTSE100INDEX',
    },
    {
      operation: 'download',
      remotePath: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
      instrument: 'Russell1000INDEX',
    },
  ],
)

export const indiceToFileMap = {
  FTSE100INDEX: 'ukallv{{dd}}{{mm}}.csv',
  Russell1000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell2000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell3000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
}

export type TInputParameters = typeof inputParameters.definition

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: any // The parsed data will be returned as result
    Data: {
      result: any // The parsed data
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'sftp',
  transport: sftpTransport,
  inputParameters,
})
