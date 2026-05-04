import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { poolTokenRateTransport } from '../transport/pool-token-rate'

export const inputParameters = new InputParameters(
  {
    stakePoolAccountAddress: {
      description: 'The address of the stake pool account to fetch the pool token rate for',
      type: 'string',
      required: true,
    },
  },
  [
    {
      stakePoolAccountAddress: 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      rate: string
      decimals: number
      totalLamports: string
      poolTokenSupply: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'pool-token-rate',
  aliases: [],
  transport: poolTokenRateTransport,
  inputParameters,
})
