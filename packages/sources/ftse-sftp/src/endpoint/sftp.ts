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
    filePath: {
      required: true,
      type: 'string',
      description: 'file path and file to download without date template',
    },
  },
  [
    {
      instrument: 'FTSE100INDEX',
      filePath: 'Test_File_Path',
    },
    {
      instrument: 'Russell1000INDEX',
      filePath: 'Test_File_Path',
    },
    {
      instrument: 'Russell2000INDEX',
      filePath: 'Test_File_Path',
    },
    {
      instrument: 'Russell3000INDEX',
      filePath: 'Test_File_Path',
    },
  ],
)

export const instructionToDateTemplateMap = {
  FTSE100INDEX: '{{dd}}{{mm}}.csv',
  Russell1000INDEX: '{{yy}}{{mm}}{{dd}}.CSV',
  Russell2000INDEX: '{{yy}}{{mm}}{{dd}}.CSV',
  Russell3000INDEX: '{{yy}}{{mm}}{{dd}}.CSV',
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
