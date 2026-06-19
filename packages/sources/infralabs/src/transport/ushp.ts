import { InfralabsTransport } from './infralabs'

export const ushpTransport = new InfralabsTransport(
  (s) => s.USHP_API_ENDPOINT,
  (s) => s.USHP_MAX_STALENESS_SECS,
)
