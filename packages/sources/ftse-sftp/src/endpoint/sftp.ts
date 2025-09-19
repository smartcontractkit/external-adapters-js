import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { FTSE100Data } from '../parsing/ftse100'
import { RussellDailyValuesData } from '../parsing/russell'
import { validateInstrument } from '../transport/constants'
import { sftpTransport } from '../transport/sftp'

export const inputParameters = new InputParameters(
  {
    instrument: {
      required: true,
      type: 'string',
      description: 'Abstract identifier of the index to fetch the data for',
    },
  },
  [
    {
      instrument: 'FTSE100INDEX',
    },
    {
      instrument: 'Russell1000INDEX',
    },
    {
      instrument: 'Russell2000INDEX',
    },
    {
      instrument: 'Russell3000INDEX',
    },
  ],
)

/**
 * Union type for all possible response data structures
 */
export type IndexResponseData = FTSE100Data | RussellDailyValuesData

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      filename: string
      result: IndexResponseData
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'sftp',
  transport: sftpTransport,
  inputParameters,
  customInputValidation: (request, _settings): AdapterError | undefined => {
    const { instrument } = request.requestContext.data
    validateInstrument(instrument)
    return
  },
})
