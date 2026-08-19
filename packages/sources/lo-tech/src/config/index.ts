import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'
import { tz } from '@date-fns/tz'
import { isValid } from 'date-fns'

export const isValidTimezone = (timezone: string): boolean => {
  return isValid(tz(timezone)(0))
}

export const config = new AdapterConfig(
  {
    REGION_API_KEY: {
      description: 'Lo-Tech API key for the given ${REGION}. Region can be "US" or "ASIA"',
      type: 'string',
      required: true,
      variablePlaceholder: 'REGION',
      sensitive: true,
    },
    REGION_WS_API_ENDPOINT: {
      description:
        'Lo-Tech websocket endpoint for the given ${REGION}. Region can be "US" or "ASIA"',
      type: 'string',
      required: true,
      variablePlaceholder: 'REGION',
      sensitive: false,
    },
    FUTURES_API_KEY: {
      description: 'Lo-Tech API key used with the futures websocket endpoint',
      type: 'string',
      required: false,
      sensitive: true,
    },
    FUTURES_WS_API_ENDPOINT: {
      description: 'Lo-Tech websocket endpoint used for the `cme_futures` endpoint',
      type: 'string',
      required: false,
      sensitive: false,
    },
    ROLL_DATE_TIMEZONE: {
      description: 'The timezone used to convert the roll date to a unix timestamps',
      type: 'string',
      default: 'America/New_York',
      sensitive: false,
      validate: {
        meta: {},
        fn: (value) => {
          if (value && isValidTimezone(value)) {
            return
          }
          return `Invalid timezone string: '${value}'`
        },
      },
    },
    ROLL_DATE_TIME_SECONDS: {
      description:
        'The time in seconds since the start of the day to use to convert the roll date to a unix timestamps',
      type: 'number',
      default: 0,
      validate: validator.integer({ min: 0, max: 86399 }),
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 30_000,
    },
  },
)
