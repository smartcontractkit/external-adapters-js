import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getApiKeys } from '../transport/creds'
import { navTransport } from '../transport/nav'

/** Default timezone to offset UTC midnight for navDateTimestampMs. */
export const DEFAULT_NAV_DATE_TIMESTAMP_TIMEZONE = 'America/Los_Angeles'

export const inputParameters = new InputParameters(
  {
    globalFundID: {
      required: true,
      type: 'number',
      description: 'Used to match API_KEY_${globalFundID} SECRET_KEY_${globalFundID} env variables',
    },
    navDateTimestampTimezone: {
      required: false,
      type: 'string',
      description:
        'timezone for midnight in navDateTimestampMs (e.g. "America/New_York", "America/Los_Angeles", "UTC").',
      default: DEFAULT_NAV_DATE_TIMESTAMP_TIMEZONE,
    },
  },
  [
    {
      globalFundID: 1234,
      navDateTimestampTimezone: 'UTC',
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      navPerShare: number
      nextNavPerShare: number
      navDate: string
      navDateTimestampMs: number
      globalFundID: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: navTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    getApiKeys(req.requestContext.data.globalFundID)
    const timezone = req.requestContext.data.navDateTimestampTimezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      return new AdapterInputError({
        message: `navDateTimestampTimezone "${timezone}" is invalid`,
        statusCode: 400,
      })
    }
    return
  },
})
