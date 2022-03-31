import * as shell from 'shelljs'

import { getJsonFile, saveText } from '../shared/docGenUtils'
import { Schema } from '../shared/docGenTypes'

/**
 * Dependency Overrides define which dependent adapters are required for a given
 * composite adapter. If a composite adapter does not have overrides,
 * then the dependencies are parsed from the schemas/env.json.
 */
const dependencyOverrides: { [adapter: string]: string[] } = {
  'reference-transform': ['coingecko'],
}

export const saveAdapterDependencies = (
  adapters: string[],
  path = './packages/scripts/src/adapter-dependencies/dependencies.txt',
): void => {
  const dependencies: string[] = []
  for (const adapter of adapters) {
    if (dependencyOverrides[adapter]) {
      for (const dep of dependencyOverrides[adapter]) {
        if (!dependencies.includes(dep)) dependencies.push(dep)
      }
      continue
    }

    const schemaPath = `./packages/composites/${adapter}/schemas/env.json`

    if (!shell.test('-f', schemaPath)) continue

    const { allOf = [] } = getJsonFile(schemaPath) as Schema

    for (const dep of allOf) {
      if (!('anyOf' in dep)) continue

      for (const { required } of dep.anyOf) {
        for (const req of required) {
          if (!req.includes('_ADAPTER_URL')) continue

          let adapterName = req.split('_ADAPTER_URL')[0]

          adapterName = adapterName.toLowerCase().replace('_', '-').replace('-com$', '.com')

          if (!dependencies.includes(adapterName)) dependencies.push(adapterName)
        }
      }
    }
  }

  saveText({ text: dependencies.join(' '), path })
}
