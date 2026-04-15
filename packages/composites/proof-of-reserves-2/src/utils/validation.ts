import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { RequestParams } from '../endpoint/reserves'

type FixedAddressList = {
  name: string
  fixed: string
  provider?: never
  params?: never
  addressArrayPath?: never
}

type ProvidedAddressList = {
  name: string
  provider: string
  params: string
  addressArrayPath: string
  fixed?: never
}

type CheckedAddressList = FixedAddressList | ProvidedAddressList

export const getProviderUrl = (provider: string): string => {
  const providerUrlEnvVarName = `${provider.replace(/\W/g, '_').toUpperCase()}_URL`
  const url = process.env[providerUrlEnvVarName]
  if (!url) {
    throw new AdapterError({
      statusCode: 500,
      message: `Missing environment variable for provider URL: ${providerUrlEnvVarName}`,
    })
  }
  return url
}

export const checkProviderUrls = (params: RequestParams) => {
  for (const addressList of params.addressLists) {
    if (addressList.provider !== undefined) {
      getProviderUrl(addressList.provider)
    }
  }

  for (const balanceSource of params.balanceSources) {
    getProviderUrl(balanceSource.provider)
  }

  for (const conversion of params.conversions) {
    getProviderUrl(conversion.provider)
  }
}

export const checkAddressList: (
  addressList: RequestParams['addressLists'][number],
) => asserts addressList is CheckedAddressList = (addressList) => {
  if (addressList.fixed) {
    try {
      const parsed = JSON.parse(addressList.fixed)
      if (!Array.isArray(parsed)) {
        throw new Error('value is not an array')
      }
    } catch (error: unknown) {
      // Catch either JSON parsing error or the error thrown when the parsed
      // value is not an array
      throw new AdapterInputError({
        statusCode: 400,
        message: `Address list '${addressList.name}' has invalid fixed value: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
    if (addressList.provider || addressList.params || addressList.addressArrayPath) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Address list '${addressList.name}' cannot have 'provider', 'params' or 'addressArrayPath' params when 'fixed' param is provided`,
      })
    }
  } else {
    if (!addressList.provider || !addressList.params || !addressList.addressArrayPath) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Address list '${addressList.name}' must have 'provider', 'params' and 'addressArrayPath' params when 'fixed' param is not provided`,
      })
    }
    try {
      JSON.parse(addressList.params)
    } catch (error: unknown) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Address list '${addressList.name}' has invalid 'params' value: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  }
}

export const checkAddressLists = (params: RequestParams) => {
  for (const addressList of params.addressLists) {
    checkAddressList(addressList)
  }
}

export const checkBalanceSources = (params: RequestParams) => {
  for (const balanceSource of params.balanceSources) {
    try {
      JSON.parse(balanceSource.params)
    } catch (error: unknown) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Balance source '${balanceSource.name}' has invalid 'params' value: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  }
}

export const checkConversions = (params: RequestParams) => {
  for (const conversion of params.conversions) {
    try {
      JSON.parse(conversion.params)
    } catch (error: unknown) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Conversion '${conversion.from}/${conversion.to}' has invalid 'params' value: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  }
}

const checkComponentReferences = (params: RequestParams) => {
  const addressListNames = new Set(params.addressLists.map((list) => list.name))
  const balanceSourceNames = new Set(params.balanceSources.map((source) => source.name))
  const conversionNames = new Set(
    params.conversions.flatMap((conversion) => [
      `${conversion.from}/${conversion.to}`,
      `${conversion.to}/${conversion.from}`,
    ]),
  )

  for (const component of params.components) {
    if (component.addressList !== undefined && !addressListNames.has(component.addressList)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Component '${component.name}' references unknown 'addressList': '${component.addressList}'`,
      })
    }
    if (!balanceSourceNames.has(component.balanceSource)) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Component '${component.name}' references unknown 'balanceSource': '${component.balanceSource}'`,
      })
    }
    for (const conversion of component.conversions) {
      if (conversion.split('/').length !== 2) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `Component '${component.name}' has invalid conversion format '${conversion}', expected 'FROM/TO'`,
        })
      }
      if (!conversionNames.has(conversion)) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `Component '${component.name}' references unknown conversion: '${conversion}'`,
        })
      }
    }
  }
}

const checkComponentAddressArrayPaths = (params: RequestParams) => {
  const balanceSourceToAddressArrayPath: Record<string, string | undefined> = {}
  for (const balanceSource of params.balanceSources) {
    balanceSourceToAddressArrayPath[balanceSource.name] = balanceSource.addressArrayPath
  }
  for (const component of params.components) {
    if (
      component.addressList !== undefined &&
      balanceSourceToAddressArrayPath[component.balanceSource] === undefined
    ) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Component '${component.name}' uses an address list so its 'balanceSource' '${component.balanceSource}' must have an 'addressArrayPath' defined.`,
      })
    }
    if (
      component.addressList === undefined &&
      balanceSourceToAddressArrayPath[component.balanceSource] !== undefined
    ) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Component '${component.name}' has a 'balanceSource' '${component.balanceSource}' with an 'addressArrayPath' defined, so the component must have an 'addressList'.`,
      })
    }
  }
}

const checkComponentConversions = (params: RequestParams) => {
  const finalCurrencies: Record<string, string> = {}
  for (const component of params.components) {
    let currency = component.currency
    for (const conversion of component.conversions) {
      const [from, to] = conversion.split('/')
      if (from !== currency) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `In component '${component.name}', conversion '${conversion}' cannot be applied to currency '${currency}'.`,
        })
      }
      currency = to
    }
    finalCurrencies[component.name] = currency
  }
  if (new Set(Object.values(finalCurrencies)).size > 1) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Components cannot be added together as they are not converted to the same final currency. Final currencies: ${JSON.stringify(
        finalCurrencies,
      )}`,
    })
  }
}

export const checkComponents = (params: RequestParams) => {
  checkComponentReferences(params)
  checkComponentAddressArrayPaths(params)
  checkComponentConversions(params)
}
