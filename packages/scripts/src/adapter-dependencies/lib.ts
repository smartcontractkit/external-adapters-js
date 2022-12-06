import * as shell from 'shelljs'

import { getJsonFile, saveText } from '../shared/docGenUtils'
import { Schema } from '../shared/docGenTypes'

const canAccessFile = (path: string): boolean => shell.test('-f', path)

const directories = ['composites', 'core', 'sources', 'targets', 'non-deployable']

const loadSchemaFile = (adapterName: string): Schema | undefined => {
  if (adapterName === 'ea-bootstrap') adapterName = 'bootstrap'

  for (const directory of directories) {
    const path = `./packages/${directory}/${adapterName}/schemas/env.json`
    if (!canAccessFile(path)) continue

    return getJsonFile(path) as Schema
  }

  return undefined
}

const followRefsAndGetRequired = (schema: Schema, easFollowed: string[] = []): string[] => {
  const required: string[] = []
  if (!schema.allOf) return required

  for (const dep of schema.allOf) {
    if ('anyOf' in dep) {
      required.push(...dep.anyOf.flatMap((any) => any.required))
    }
    if ('$ref' in dep) {
      if (!dep.$ref.startsWith('https://external-adapters.chainlinklabs.com/schemas/')) continue

      const adapterName = (dep.$ref.split('/').pop() || '').split('-adapter.json')[0]
      if (easFollowed.includes(adapterName)) continue
      easFollowed.push(adapterName)

      const refSchema = loadSchemaFile(adapterName)
      if (!refSchema) continue

      required.push(...followRefsAndGetRequired(refSchema, easFollowed))
    }
  }

  return required
}

export const saveAdapterDependencies = (
  adapters: string[],
  path = './packages/scripts/src/adapter-dependencies/dependencies.txt',
): void => {
  const dependencies: string[] = []
  for (const adapter of adapters) {
    const schemaPath = `./packages/composites/${adapter}/schemas/env.json`

    if (!shell.test('-f', schemaPath)) continue

    const schema = getJsonFile(schemaPath) as Schema

    const required = followRefsAndGetRequired(schema)

    for (const req of required) {
      if (!req.includes('_ADAPTER_URL')) continue

      let adapterName = req.split('_ADAPTER_URL')[0]

      adapterName = adapterName.toLowerCase().replace('_', '-').replace('-com$', '.com')

      if (!dependencies.includes(adapterName)) dependencies.push(adapterName)
    }
  }

  saveText({ text: dependencies.join(' '), path })
}
