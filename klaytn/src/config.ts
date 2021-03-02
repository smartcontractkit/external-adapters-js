import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  url: string
  privatekey: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    url: util.getEnv('URL', prefix) || 'http://localhost:8551',
    privatekey: util.getRequiredEnv('PRIVATE_KEY', prefix),
  }
}
