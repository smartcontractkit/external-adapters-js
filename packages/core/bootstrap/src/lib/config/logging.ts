// List of default and custom env vars that need to be redacted when logging
export const configRedactEnvVars = [
  'API_KEY',
  'API_PASSWORD',
  'PRIVATE_KEY',
  'PASSWORD',
  'WS_API_KEY',
  'WS_PRIVATE_KEY',
  'WS_SOCKET_KEY',
  'API_CLIENT_KEY',
  'API_CLIENT_SECRET',
  'NFT_API_AUTH_HEADER',
  'FOREX_WS_PASSWORD',
  'NFL_SCORES_API_KEY',
  'MMA_STATS_API_KEY',
  'CFB_SCORES_API_KEY',
  'NBA_API_KEY',
  'MLB_API_KEY',
  'AIRTABLE_API_KEY',
  'DWOLLA_APP_KEY',
  'DWOLLA_APP_SECRET',
]

// Paths to values not covered by env var censorship
// Scenarios where credentials are encoded
export const redactPaths = [
  'config.api.headers.Authorization',
  'config.api.headers.authorization',
  'config.adapterSpecificParams.forexEncodedCreds',
  'rawError.config.headers.Authorization',
  'rawError.config.headers.authorization',
]

export class CensorList {
  static censorList: CensorKeyValue[] = []
  static getAll(): CensorKeyValue[] {
    return this.censorList
  }
  static set(censorList: CensorKeyValue[]): void {
    this.censorList = censorList
  }
}

export interface CensorKeyValue {
  key: string
  value: RegExp
}
