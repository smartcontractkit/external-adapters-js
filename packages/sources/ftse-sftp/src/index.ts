import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { endpoint as sftpEndpoint } from './endpoint/sftp'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: sftpEndpoint.name,
  name: 'FTSE_SFTP',
  config,
  endpoints: [sftpEndpoint],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 10,
        note: 'SFTP operations are generally not rate limited, but setting reasonable limits',
      },
    },
  },
})
