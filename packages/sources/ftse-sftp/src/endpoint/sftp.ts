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
    instrument: {
      required: true,
      type: 'string',
      description: 'Name of the file for download or upload operations',
    },
  },
  [
    {
      operation: 'download',
      instrument: 'FTSE100INDEX',
    },
    {
      operation: 'download',
      instrument: 'Russell1000INDEX',
    },
  ],
)

export const instrumentToFileMap = {
  FTSE100INDEX: 'ukallv{{dd}}{{mm}}.csv',
  Russell1000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell2000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell3000INDEX: 'daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
}

export const instrumentToRemotePathMap = {
  FTSE100INDEX: '/data/valuation/uk_all_share/',
  Russell1000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell2000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
  Russell3000INDEX: '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
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
