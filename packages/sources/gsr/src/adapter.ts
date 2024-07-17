import {
  Adapter,
  AdapterParams,
  DEFAULT_LWBA_ALIASES,
  IncludesFile,
  PriceEndpoint,
  PriceEndpointGenerics,
  PriceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
import {
  AdapterRequest,
  AdapterRequestContext,
  AdapterResponse,
} from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import {
  EmptyInputParameters,
  TypeFromDefinition,
} from '@chainlink/external-adapter-framework/validation/input-params'

type IncludeDetails = {
  from: string
  to: string
  inverse: boolean
}
type IncludesMap = Record<string, Record<string, IncludeDetails>>

type PriceAdapterRequest<T> = AdapterRequest<T> & {
  requestContext: AdapterRequestContext<T> & {
    priceMeta: {
      inverse: boolean
    }
  }
}

const buildIncludesMap = (includesFile: IncludesFile) => {
  const includesMap: IncludesMap = {}

  for (const { from, to, includes } of includesFile) {
    if (!includesMap[from]) {
      includesMap[from] = {}
    }
    includesMap[from][to] = includes[0]
  }

  return includesMap
}

export class GSRPriceAdapter<
  CustomSettingsDefinition extends SettingsDefinitionMap,
> extends Adapter<CustomSettingsDefinition> {
  includesMap?: IncludesMap

  constructor(
    params: AdapterParams<CustomSettingsDefinition> & {
      includes?: IncludesFile
    },
  ) {
    const priceEndpoints = params.endpoints.filter(
      (e) => e instanceof PriceEndpoint,
    ) as PriceEndpoint<PriceEndpointGenerics>[]
    if (!priceEndpoints.length) {
      throw new Error(
        `This PriceAdapter's list of endpoints does not contain a valid PriceEndpoint`,
      )
    }

    super(params)

    if (params.includes) {
      // Build includes map for constant lookups
      this.includesMap = buildIncludesMap(params.includes)

      const requestTransform = (req: AdapterRequest<EmptyInputParameters>) => {
        const priceRequest = req as PriceAdapterRequest<
          TypeFromDefinition<PriceEndpointInputParametersDefinition>
        >

        const requestData = priceRequest.requestContext.data
        if (!requestData.base || !requestData.quote) {
          return
        }
        const includesDetails = this.includesMap?.[requestData.base]?.[requestData.quote]

        if (includesDetails) {
          requestData.base = includesDetails.from || requestData.base
          requestData.quote = includesDetails.to || requestData.quote
        }

        const inverse = includesDetails?.inverse || false
        priceRequest.requestContext.priceMeta = {
          inverse,
        }
      }

      for (const endpoint of priceEndpoints) {
        endpoint.requestTransforms?.push(requestTransform)
      }
    }
  }

  override async handleRequest(
    req: PriceAdapterRequest<PriceEndpointInputParametersDefinition>,
    replySent: Promise<unknown>,
  ): Promise<AdapterResponse> {
    const response = await super.handleRequest(req, replySent)

    if (this.includesMap && req.requestContext.priceMeta?.inverse) {
      // We need to search in the reverse order (quote -> base) because the request transform will have inverted the pair

      // Deep clone the response, as it may contain objects which won't be cloned by simply destructuring
      const cloneResponse = JSON.parse(JSON.stringify(response))

      const inverseResult = 1 / (cloneResponse.result as number)
      cloneResponse.result = inverseResult
      // Check if response data has a result within it
      const data = cloneResponse.data as { result: number } | null
      if (data?.result) {
        data.result = inverseResult
      }
      return cloneResponse
    }

    return response
  }

  // Custom implementation of validateOutput to execute only for LWBA endpoints
  // This is because we need to use the same transport and cache keys for both price and LWBA endpoints due to the way GSR's API works
  override validateOutput(
    req: AdapterRequest<EmptyInputParameters>,
    output: Readonly<AdapterResponse>,
  ): AdapterError | undefined {
    const endpointObj = this.endpointsMap[req.requestContext.endpointName]
    const { endpoint = '' } = req.body.data
    const isLwba = DEFAULT_LWBA_ALIASES.includes(endpoint.toLowerCase())

    if (endpointObj.customOutputValidation && isLwba) {
      return endpointObj.customOutputValidation(output)
    }
    return undefined
  }
}
