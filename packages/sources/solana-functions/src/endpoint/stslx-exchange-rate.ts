import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { type AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { parseRateBounds } from '../shared/exchange-rate-utils'
import { stslxExchangeRateTransport } from '../transport/stslx-exchange-rate'

export const DEFAULT_SLX_MINT_ADDRESS = 'SLXdx4BUt2v9uJQNzWqSfzTJ9UKLUDsvxHFMEEdrfgq'
export const DEFAULT_STSLX_MINT_ADDRESS = 'GxHksENo754dKj6kv5d2z7ey9KwE7YSRYgRCtoFYd2yq'
export const DEFAULT_GLAM_STATE_ADDRESS = '5E2scHi8LyZAqZeVHnXLeFhwoePxD2CTdSruWmjgVEoB'
export const DEFAULT_GLAM_PROTOCOL_PROGRAM_ADDRESS = 'GLAMpaME8wdTEzxtiYEAa5yD8fZbxZiz2hNtV58RZiEz'

export const inputParameters = new InputParameters(
  {
    slxMintAddress: {
      description: 'SLX mint address',
      type: 'string',
      required: false,
      default: DEFAULT_SLX_MINT_ADDRESS,
    },
    stslxMintAddress: {
      description: 'stSLX mint address',
      type: 'string',
      required: false,
      default: DEFAULT_STSLX_MINT_ADDRESS,
    },
    glamStateAddress: {
      description: 'GLAM state address used to derive the vault PDA',
      type: 'string',
      required: false,
      default: DEFAULT_GLAM_STATE_ADDRESS,
    },
    glamProtocolProgramAddress: {
      description: 'GLAM protocol program address used to derive the vault PDA',
      type: 'string',
      required: false,
      default: DEFAULT_GLAM_PROTOCOL_PROGRAM_ADDRESS,
    },
    minRate: {
      description: 'Minimum allowed stSLX-SLX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: false,
    },
    maxRate: {
      description: 'Maximum allowed stSLX-SLX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: false,
    },
  },
  [
    {
      slxMintAddress: DEFAULT_SLX_MINT_ADDRESS,
      stslxMintAddress: DEFAULT_STSLX_MINT_ADDRESS,
      glamStateAddress: DEFAULT_GLAM_STATE_ADDRESS,
      glamProtocolProgramAddress: DEFAULT_GLAM_PROTOCOL_PROGRAM_ADDRESS,
      minRate: '950000000000000000',
      maxRate: '1050000000000000000',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      computedResult: string
      decimals: number
      boundsApplied: boolean
      slxBalance: string
      stslxSupply: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stslx-exchange-rate',
  aliases: [],
  transport: stslxExchangeRateTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    parseRateBounds(req.requestContext.data.minRate, req.requestContext.data.maxRate)

    return
  },
})
