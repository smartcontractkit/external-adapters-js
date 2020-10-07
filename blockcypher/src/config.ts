export const ENV_API_KEY = 'API_KEY'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  apiKey?: string
}

export const getConfig = (): Config => ({
  apiKey: process.env[ENV_API_KEY],
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config => (({ apiKey, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  console.log('Adapter configuration:')
  console.log(cloneNoSecrets(config))
  if (!config.apiKey) console.warn('API will be rate limited without an API key.')
}
