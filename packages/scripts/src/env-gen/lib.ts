import { writeFileSync } from 'fs'
import { join } from 'path'
import { mkdir } from 'shelljs'
import { getWorkspacePackages, PUBLIC_ADAPTER_TYPES, WorkspacePackage } from '../workspace'

export function writeMergedEnvs(): void {
  const mergedEnvs = getMergedEnvs()
  mergedEnvs.forEach((x) => {
    mkdir('-p', join(x.location, 'schemas'))
    writeFileSync(join(x.location, 'schemas/env.json'), JSON.stringify(x.payload, null, 1))
  })
}

export function getMergedEnvs(): {
  location: string
  payload: any
}[] {
  const packages = getWorkspacePackages(['core'])
  const refIgnore = [
    '@chainlink/ea-factories',
    '@chainlink/ea-legos',
    '@chainlink/ea-ratelimits',
    '@chainlink/ea-test-helpers',
    '@chainlink/types',
    '@chainlink/ea-reference-data-reader',
  ]
  const locationToPackage = packages.reduce<Record<string, WorkspacePackage>>((prev, next) => {
    prev[next.location] = next
    return prev
  }, {})
  const packagesToProcess = packages.filter((p) => PUBLIC_ADAPTER_TYPES.includes(p.type))

  return packagesToProcess.map((p) => {
    // note that this does not do sub-reference traversal
    const refPackages = p.tsconf?.references
      .map((r) => {
        const refLocation = join(p.location, r.path)
        const refPackage = locationToPackage[refLocation]

        return refPackage
      })
      .filter((p) => !refIgnore.includes(p.name))

    const mergedRefs = refPackages?.map((p) => {
      return { $ref: makeId(p.descopedName) }
    })

    const env: Record<string, any> = p.environment ?? {}
    const envKeys = Object.keys(env)
    const requiredKeys = envKeys.filter((k) => env[k]?.required)
    const newenv: Record<string, any> = {}
    const allOf: any = []
    for (const [k, v] of Object.entries(env)) {
      newenv[k] = { ...v }
      newenv[k].type = v.type || typeof v.default !== 'undefined' ? typeof v.default : 'string'
      delete newenv[k]['required']
      if (newenv[k].oneOf) {
        allOf.push({
          anyOf: newenv[k].oneOf.map((additional: any) => {
            newenv[additional] = {
              type: 'string',
            }

            return { required: [additional] }
          }),
        })
        delete newenv[k]
      }
      if (k.includes('URL')) {
        newenv[k].format = 'uri'
      }
    }

    return {
      location: p.location,
      payload: {
        $id: makeId(p.descopedName),
        title: `${p.name} env var schema`,
        required: requiredKeys,
        type: 'object',
        properties: newenv,
        allOf: [...(mergedRefs || []), ...allOf],
      },
    }
  })
}

function makeId(path: string) {
  return join('https://external-adapters.chainlinklabs.com/schemas', `${path}.json`)
}
