import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export enum DNSProviders {
  Cloudfare = 'cloudfare',
  Google = 'google',
}

export const endpoints: Record<string, string> = {
  [DNSProviders.Cloudfare]: 'https://cloudflare-dns.com/dns-query',
  [DNSProviders.Google]: 'https://dns.google/resolve',
}

export const makeConfig = (): Config => {
  const customEndpoint = util.getEnv('CUSTOM_ENDPOINT')
  if (customEndpoint) {
    return { api: { url: customEndpoint } }
  }
  const provider = util.getRequiredEnv('DNS_PROVIDER')
  if (!Object.values(DNSProviders).includes(provider))
    throw new Error(`Unknown DNS Provider: ${provider}`)

  const config: Config = { api: { url: endpoints[provider] } }
  return config
}
