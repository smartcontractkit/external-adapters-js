export const ENV_API_ENDPOINT = 'API_ENDPOINT'

export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  api: Record<string, unknown>
}

// Custom error for required env variable.
export class RequiredEnvError extends Error {
  constructor(name: string) {
    super(`Please set the required env ${name}.`)
    this.name = RequiredEnvError.name
  }
}

/**
 * Get variable from environments
 * @param name The name of environment variable
 * @throws {RequiredEnvError} Will throw an error if environment variable is not defined.
 * @returns {string}
 */
export const getRequiredEnv = (name: string): string => {
  const val = process.env[name]
  if (!val) throw new RequiredEnvError(name)
  return val
}

// TODO: add blockchain.info API key support
export const getConfig = (): Config => ({
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout: 30000,
    baseURL: getRequiredEnv(ENV_API_ENDPOINT),
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  },
})

export const logConfig = (config: Config): void => {
  console.log('Adapter configuration:')
  console.log(config)
}
