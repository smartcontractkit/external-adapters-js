import * as shell from 'shelljs'

import { getJsonFile, saveText } from '../shared/docGenUtils'
import { Schema } from '../shared/docGenTypes'

export const saveAdapterDependencies = (
  adapters: string[],
  path = './packages/scripts/src/adapter-dependencies/dependencies.txt',
): void => {
  const dependencies: string[] = []
  for (const adapter of adapters) {
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

          if (adapterName === 'source') {
            adapterName = 'coingecko' //TODO use whichever EAs are used for reference-transform test payloads
          }

          if (!dependencies.includes(adapterName)) dependencies.push(adapterName)
        }
      }
    }
  }

  saveText({ text: dependencies.join(' '), path })
}
