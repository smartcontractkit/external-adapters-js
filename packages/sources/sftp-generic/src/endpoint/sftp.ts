import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { sftpTransport } from '../transport/sftp'

export const inputParameters = new InputParameters(
  {
    operation: {
      required: true,
      type: 'string',
      options: ['download'],
      description: 'SFTP operation to perform: list files, download file, or upload file',
    },
    remotePath: {
      required: true,
      type: 'string',
      description: 'Remote path on the SFTP server (defaults to root /)',
    },
    fileName: {
      required: true,
      type: 'string',
      description: 'Name of the file for download or upload operations',
    }
  },
  [
    {
      operation: 'download',
      remotePath: '/data',
      fileName: 'example.txt',
    },
  ],
)

export type TInputParameters = typeof inputParameters.definition

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'sftp',
  transport: sftpTransport,
  inputParameters,
})
