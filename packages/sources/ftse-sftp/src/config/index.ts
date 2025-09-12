import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const NAME = 'FTSE_SFTP_ADAPTER'

export const config = new AdapterConfig({
  SFTP_HOST: {
    description: 'SFTP server hostname or IP address',
    type: 'string',
    required: true,
  },
  SFTP_PORT: {
    description: 'SFTP server port',
    type: 'number',
    default: 22,
  },
  SFTP_USERNAME: {
    description: 'SFTP username for authentication',
    type: 'string',
    required: true,
  },
  SFTP_PASSWORD: {
    description: 'SFTP password for authentication',
    type: 'string',
    sensitive: true,
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
