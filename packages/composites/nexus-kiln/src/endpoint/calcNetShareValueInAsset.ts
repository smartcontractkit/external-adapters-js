import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { nexusKilnTransport } from '../transport/calcNetShareValueInAsset'

export const inputParameters = new InputParameters(
  {
    calculatorContract: {
      required: true,
      type: 'string',
      description: 'Passthrough to enzyme adapter',
    },
    quoteAsset: {
      required: true,
      type: 'string',
      description: 'Passthrough to enzyme adapter',
    },
    nexusVaultContract: {
      required: true,
      type: 'string',
      description: 'The Nexus Vault address',
    },
    kilnStakingContract: {
      required: true,
      type: 'string',
      description: 'The Kiln Staking Contract address',
    },
    minConfirmations: {
      type: 'number',
      description:
        'Number of blocks that must have been confirmed after the point against which the balance is checked',
      default: 6,
    },
  },
  [
    {
      calculatorContract: '0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9',
      quoteAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      nexusVaultContract: '0x27f23c710dd3d878fe9393d93465fed1302f2ebd',
      kilnStakingContract: '0x0816df553a89c4bff7ebfd778a9706a989dd3ce3',
      minConfirmations: 6,
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      wETH: string
      unclaimedKilnFees: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'calcNetShareValueInAsset',
  aliases: [],
  transport: nexusKilnTransport,
  inputParameters,
})
