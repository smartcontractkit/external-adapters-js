import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { FTSE100Data } from '../parsing/ftse100'
import { RussellDailyValuesData } from '../parsing/russell'
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

export type TInputParameters = typeof inputParameters.definition

/**
 * Union type for all possible response data structures
 */
export type IndexResponseData = FTSE100Data | RussellDailyValuesData

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: IndexResponseData
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'ftse_sftp',
  transport: sftpTransport,
  inputParameters,
})
