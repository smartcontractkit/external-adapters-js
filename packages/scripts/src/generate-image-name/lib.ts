import { generateFileJSON } from '../docker-build/lib'

/**
 * Create a image name that matches what the "docker-build" script outputs as a docker-compose file.
 *
 * Used as a workaround to a gha restriction where we were unable to use the output of the "gha" action if it contained secrets.
 */
export async function generateImageName(): Promise<string> {
  // A descoped adapter name is the name field of package.json of an adapter, without the org scope of "@chainlink/"
  const descopedName = process.env.ADAPTER_NAME
  const branch = process.env.BRANCH || ''
  const prefix = process.env.IMAGE_PREFIX || ''
  const useLatest = !!process.env.LATEST

  if (!descopedName) {
    throw Error(
      'A descoped adapter name must be available as an environment variable under ADAPTER_NAME',
    )
  }

  const dockerfile = await generateFileJSON({ prefix, branch, useLatest }, { context: '.' })
  const adapters = Object.entries(dockerfile.services)
    .filter(([k]) => k === descopedName)
    .map(([, v]) => v.image)

  if (adapters.length === 0) {
    throw Error(
      `Invalid adapter name provided, no matching adapter name found in workspace packages.`,
    )
  }
  if (adapters.length > 1) {
    throw Error(
      `Ambiguous adapter name provided, multiple matching adapter names found in workspace packages.`,
    )
  }

  return adapters[0]
}
