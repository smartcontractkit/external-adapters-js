import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SNOWFLAKE'

export const DEFAULT_ENDPOINT = 'covid-cases'
export const DEFAULT_DATABASE = 'COVID19_BY_STARSCHEMA_DM'
export const DEFAULT_SCHEMA = 'PUBLIC'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)

  const account: string = util.getRequiredEnv('ACCOUNT')
  const privateKey: string = util.getRequiredEnv('PRIVATE_KEY')
  const username: string = util.getRequiredEnv('DB_USERNAME')

  const database: string = util.getEnv('DATABASE') || DEFAULT_DATABASE
  const schema: string = util.getEnv('SCHEMA') || DEFAULT_SCHEMA

  const provider: string | undefined = util.getEnv('PROVIDER')
  const region: string | undefined = util.getEnv('REGION')

  const fullAccount = [account, region, provider].filter((i) => !!i).join('.')
  const qualifiedUsername = `${account.toUpperCase()}.${username.toUpperCase()}`
  const baseURL = `https://${fullAccount}.snowflakecomputing.com/api`

  config.api = {
    account,
    baseURL,
    database,
    privateKey,
    qualifiedUsername,
    schema,
    username,
  }

  config.defaultEndpoint = DEFAULT_ENDPOINT

  return config
}
