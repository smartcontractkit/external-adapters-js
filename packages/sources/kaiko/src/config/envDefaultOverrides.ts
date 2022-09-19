import type { EnvDefaultOverrides } from '@chainlink/ea-bootstrap'

export const envDefaultOverrides: EnvDefaultOverrides = {
  API_TIMEOUT: '30000', // Note: setting to '10000' has caused excessive timeouts with their API. If planning to reduce, proceed with caution.
}
