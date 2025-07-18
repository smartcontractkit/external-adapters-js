import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/multiplier'

export const inputParameters = new InputParameters(
  {
    tokenSymbol: {
      required: true,
      type: 'string',
      description: 'The symbol of token to query',
    },
    network: {
      required: true,
      type: 'string',
      description: 'The symbol of the network to query',
    },
  },
  [
    {
      tokenSymbol: 'AMZNx',
      network: 'Solana',
    },
  ],
)

export type GMCIResultResponse = {
  Result: number
  Data: {
    currentMultiplier: number
    newMultiplier: number
    activationDateTime: number
    reason: string | null
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: GMCIResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'multiplier',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
