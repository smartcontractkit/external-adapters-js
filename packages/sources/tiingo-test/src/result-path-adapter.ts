// import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
// import { AdapterRequest, AdapterRequestContext, AdapterResponse, RequestGenerics } from '@chainlink/external-adapter-framework/util'
// import { PriceAdapter, AdapterParams, PriceEndpointParams, IncludesFile } from '@chainlink/external-adapter-framework/adapter'

// export type PathPriceEndpointParams = PriceEndpointParams & { resultPath?: string }

// type IncludeDetails = {
//   from: string
//   to: string
//   inverse: boolean
// }
// type IncludesMap = Record<string, Record<string, IncludeDetails>>

// type PriceAdapterRequest<T extends RequestGenerics> = AdapterRequest<T> & {
//   requestContext: AdapterRequestContext<T> & {
//     priceMeta: {
//       inverse: boolean
//     }
//   }
// }

// /**
//  * A PriceAdapter is a specific kind of Adapter that includes at least one PriceEnpoint.
//  */
//  export class PathPriceAdapter<
//  CustomSettingsDefinition extends SettingsDefinitionMap,
// > extends PriceAdapter<CustomSettingsDefinition> {
//   includesMap?: IncludesMap

//   constructor(
//     params: AdapterParams<CustomSettingsDefinition> & {
//       includes?: IncludesFile
//     },
//   ) {
//     super(params)
//   }

//   override async handleRequest(
//     req: PriceAdapterRequest<{
//       Params: PathPriceEndpointParams
//     }>,
//     replySent: Promise<unknown>,
//   ): Promise<AdapterResponse> {
//     const { resultPath } = req.requestContext.data

//     //TODO remove
//     delete req.requestContext.data.resultPath
//     // req.requestContext.data.resultPath = 'supplyRate'

//     const transportName = endpoint.getTransportNameForRequest(req, adapter.config.settings)
//       req.requestContext.cacheKey = calculateCacheKey({
//         data: req.requestContext.data,
//         adapterName: adapter.name,
//         endpointName: endpoint.name,
//         transportName,
//         inputParameters: endpoint.inputParameters,
//         adapterSettings: adapter.config.settings,
//       })

//     console.log({cacheKey: req.requestContext.cacheKey})
// //
//     const response = await super.handleRequest(req, replySent)

//     //TODO remove
//     const cachedResponse = await this.findResponseInCache(req)
//     console.log({resultPath, data: req.requestContext.data, cachedResponse})

//     if (resultPath) {
//       const cloneResponse = { ...response }
//       const data = cloneResponse.data as Record<string, any>
//       console.log(data)
//       cloneResponse.result = data[resultPath]
//       return cloneResponse
//     }

//     return response
//   }
//   }
