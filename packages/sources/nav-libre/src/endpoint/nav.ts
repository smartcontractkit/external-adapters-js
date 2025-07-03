import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import dayjs from 'dayjs'
import { config } from '../config'
import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    globalFundID: {
      required: true,
      type: 'number',
      description: 'The global fund ID for the Libre fund',
    },
    fromDate: {
      required: false,
      type: 'string',
      description: 'Start date in MM-DD-YYYY format (defaults to 7 days ago)',
      default: dayjs().subtract(7, 'day').format('MM-DD-YYYY'),
    },
    toDate: {
      required: false,
      type: 'string',
      description: 'End date in MM-DD-YYYY format (defaults to today)',
      default: dayjs().format('MM-DD-YYYY'),
    },
  },
  [
    {
      globalFundID: 139767,
      fromDate: '12-30-2024',
      toDate: '01-15-2025',
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      navPerShare: number
      navDate: string
      globalFundID: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
