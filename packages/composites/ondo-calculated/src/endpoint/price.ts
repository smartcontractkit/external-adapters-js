import { BaseEndpointTypes as DataEngineResponse } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { priceTransport } from '../transport/transport'

export const inputParameters = new InputParameters(
  {
    registry: {
      required: true,
      type: 'string',
      description: 'Ondo on-chain registry address',
    },
    asset: {
      required: true,
      type: 'string',
      description: 'Maps to the asset in ondo’s on-chain registry',
    },
    regularStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams regular hour feed ID for the underlying asset',
    },
    extendedStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams extended hour feed ID for the underlying asset',
    },
    overnightStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams overnight hour feed ID for the underlying asset',
    },
    sessionBoundaries: {
      required: true,
      type: 'string',
      array: true,
      description:
        'A list of time where market trasition from 1 session to the next in the format of HH:MM',
    },
    sessionBoundariesTimeZone: {
      required: true,
      type: 'string',
      description: 'ANA Time Zone Database format',
    },
    decimals: {
      type: 'number',
      description: 'Decimals of output result',
      default: 8,
    },
  },
  [
    {
      registry: '0x0',
      asset: '0x0',
      regularStreamId: '0x0',
      extendedStreamId: '0x0',
      overnightStreamId: '0x0',
      sessionBoundaries: ['04:00', '09:30', '16:00', '20:00'],
      sessionBoundariesTimeZone: 'America/New_York',
      decimals: 8,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      registry: {
        sValue: string
        paused: boolean
      }
      stream: {
        regular: DataEngineResponse['Response']['Data']
        extended: DataEngineResponse['Response']['Data']
        overnight: DataEngineResponse['Response']['Data']
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: priceTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    const { sessionBoundaries, sessionBoundariesTimeZone } = req.requestContext.data

    sessionBoundaries.forEach((s) => {
      if (!s.match(/^(?:[01]\d|2[0-3]):[0-5]\d$/)) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `${s} in [Param: sessionBoundaries] does not match format HH:MM`,
        })
      }
    })

    try {
      // eslint-disable-next-line new-cap
      Intl.DateTimeFormat(undefined, { timeZone: sessionBoundariesTimeZone })
    } catch (error) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `[Param: sessionBoundariesTimeZone] is not valid timezone: ${error}`,
      })
    }
    return
  },
})
