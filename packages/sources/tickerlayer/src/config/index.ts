import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'
import { tz } from '@date-fns/tz'
import { isValid } from 'date-fns'

const isValidTimezone = (timezone: string) => isValid(tz(timezone)(0))

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Data Provider',
    type: 'string',
    default: 'wss://stream.tickerlayer.com/',
    sensitive: false,
  },
  ROLL_DATE_TIMEZONE: {
    description: 'The timezone used to convert the roll date to a unix timestamp',
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
      'The time in seconds since the start of the day to use to convert the roll date to a unix timestamp',
    type: 'number',
    default: 0,
    validate: validator.integer({ min: 0, max: 86399 }),
    sensitive: false,
  },
})
