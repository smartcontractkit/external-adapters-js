// import includes from '../config/includes.json'

// type Includes = {
//   from: string
//   to: string
//   includes: [
//     {
//       from: string // From symbol
//       to: string // To symbol
//       adapters?: string[] // Array of adapters this applies to
//       inverse?: boolean // If the inverse should be calculated instead
//       tokens?: boolean // If the token addresses should be used instead
//     },
//   ]
// }

// export const withApiKey = (url: string, key: string, secret: string) =>
//   `${url}?client=${key}:${secret}`
// export const getSubscription = (to: string) => ({ topic: 'subscribe', to })

// export const baseFromIncludes = includes.reduce(
//   (basesMap: { [from: string]: string }, includesSet: Includes) => {
//     const { includes } = includesSet
//     for (const includePair of includes) {
//       basesMap[includePair.from] = includesSet.from
//     }
//     return basesMap
//   },
//   {},
// )

export type BasePairInputParameters = {
  base: string | string[]
  quote: string | string[]
}

export const getPairOptions = <TOptions, TInputParameters extends BasePairInputParameters>(
  adapterName: string,
  validator: Validator<TInputParameters>,
  getIncludesOptions: (
    validator: Validator<TInputParameters>,
    include: IncludePair,
  ) => TOptions | undefined,
  defaultGetOptions: (base: string, quote: string) => TOptions,
  customOverrideIncludes?: (base: string, quote: string, includes: string[]) => IncludePair,
): TOptions => {
  const validatedBase = validator.validated.data.base as string
  const validatedQuote = validator.validated.data.quote as string
  const includesOptionsMap = getPairOptionsMap<TOptions, TInputParameters>(
    adapterName,
    validator,
    getIncludesOptions,
    defaultGetOptions,
    customOverrideIncludes,
  )
  return includesOptionsMap[validatedBase][validatedQuote]
}
