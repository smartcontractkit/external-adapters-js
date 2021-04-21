import { writeFileSync } from 'fs'
import { join } from 'path'
import { getWorkspacePackages, PUBLIC_ADAPTER_TYPES, WorkspacePackage } from '../workspace'

export function writeMergedEnvs(): void {
  const mergedEnvs = getMergedEnvs()
  mergedEnvs.forEach((x) => {
    writeFileSync(join(x.location, 'env.generated.json'), JSON.stringify(x.mergedEnv, null, 1))
  })
}

export function getMergedEnvs(): {
  location: string
  mergedEnv: Record<string, string>
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

    const mergedEnv =
      refPackages?.reduce((prev, next) => {
        // sanity check
        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(next)
        prevKeys.forEach((k) => {
          if (nextKeys.includes(k)) {
            console.warn(`Env key collision found for: "${k}"`)
          }
        })

        return { ...prev, ...next.environment }
      }, p.environment ?? {}) ?? {}

    return { location: p.location, mergedEnv }
  })
}
