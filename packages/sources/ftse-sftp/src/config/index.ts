import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const NAME = 'SFTP_GENERIC'

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
    description: 'SFTP password for authentication (alternative to private key)',
    type: 'string',
    sensitive: true,
  },
  GROUP_SIZE: {
    description: 'Number of concurrent SFTP operations',
    type: 'number',
    default: 5,
  },
  BACKGROUND_EXECUTE_MS: {
    description: 'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  }
})
