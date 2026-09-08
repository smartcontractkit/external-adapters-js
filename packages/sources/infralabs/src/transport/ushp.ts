import { createInfralabsTransport } from './infralabs'

export const ushpTransport = createInfralabsTransport(
  (s) => s.USHP_API_ENDPOINT,
  (s) => s.USHP_MAX_STALENESS_SECS,
)
