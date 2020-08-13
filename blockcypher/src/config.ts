export const ENV_API_TOKEN = 'API_TOKEN'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  token?: string
}

export const getConfig = (): Config => ({
  token: process.env[ENV_API_TOKEN],
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config =>
  (({ token, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  console.log('Adapter configuration:')
  console.log(cloneNoSecrets(config))
  if (!config.token)
    console.warn('API will be rate limited without an API token.')
}
