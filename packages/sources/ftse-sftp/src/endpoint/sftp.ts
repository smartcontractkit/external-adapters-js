import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { sftpTransport } from '../transport/sftp'

export const inputParameters = new InputParameters(
  {
    instrument: {
      required: true,
      type: 'string',
      description: 'Name of the file to download',
    },
  },
  [
    {
      instrument: 'FTSE100INDEX',
    },
    {
      instrument: 'Russell1000INDEX',
    },
    {
      instrument: 'Russell2000INDEX',
    },
    {
      instrument: 'Russell3000INDEX',
    },
  ],
)

export const instrumentToFileTemplateMap: Record<string, string> = {
  FTSE100INDEX: '/data/valuation/uk_all_share/ukallv{{dd}}{{mm}}.csv',
  Russell1000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell2000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
  Russell3000INDEX:
    '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_{{yy}}{{mm}}{{dd}}.CSV',
}

export type TInputParameters = typeof inputParameters.definition

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: any
    Data: {
      result: any
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'ftse_sftp',
  transport: sftpTransport,
  inputParameters,
})
