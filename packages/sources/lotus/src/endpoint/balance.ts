import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'
import {
  porBalanceEndpointInputParametersDefinition,
  PoRTotalBalanceEndpoint,
} from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'

export const inputParameters = new InputParameters(porBalanceEndpointInputParametersDefinition, [
  {
    addresses: [
      { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
      { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
    ],
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      balances: { address: string; result: string }[]
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRTotalBalanceEndpoint({
  name: 'balance',
  aliases: ['Filecoin.WalletBalance'],
  transport: balanceTransport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
  ): AdapterInputError | undefined => {
    if (req.requestContext.data.addresses.length === 0) {
      return new AdapterInputError({
        statusCode: 400,
        message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      })
    }
    return
  },
})
