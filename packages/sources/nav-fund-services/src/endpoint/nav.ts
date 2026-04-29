import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getApiKeys } from '../transport/creds'
import { navTransport } from '../transport/nav'

/** Default hours after UTC midnight on the accounting date for navDateTimestampMs. */
export const DEFAULT_NAV_DATE_TIMESTAMP_UTC_OFFSET_HOURS = 6
const NAV_DATE_TIMESTAMP_UTC_OFFSET_HOURS_OPTIONS = [...Array(24).keys()] as const

export const inputParameters = new InputParameters(
  {
    globalFundID: {
      required: true,
      type: 'number',
      description: 'Used to match API_KEY_${globalFundID} SECRET_KEY_${globalFundID} env variables',
    },
    navDateTimestampUtcOffsetHours: {
      required: false,
      type: 'number',
      description:
        'Integer hours after UTC midnight on the NAV accounting date for navDateTimestampMs (0–23).',
      options: NAV_DATE_TIMESTAMP_UTC_OFFSET_HOURS_OPTIONS,
      default: DEFAULT_NAV_DATE_TIMESTAMP_UTC_OFFSET_HOURS,
    },
  },
  [
    {
      globalFundID: 1234,
      navDateTimestampUtcOffsetHours: 6,
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
    return
  },
})
