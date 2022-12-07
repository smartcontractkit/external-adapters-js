import { getWorkspacePackages, WorkspacePackage } from '../workspace'

interface JobMatrix {
  adapter: {
    name: string
    type: string
  }[]
}

/**
 * Create a job matrix that allows our build pipeline to create and push
 * docker images.
 *
 * By default, will return only adapters that have been changed in the target branch (develop by default)
 * Call with `yarn generate:gha:matrix -a` -OR- `BUILD_ALL=true yarn generate:gha:matrix` to build all adapters
 */

type MatrixOutput = {
  name: string
  type: string
}

// Function to correct adapter directory names to their full formal name, used in partial runs

const calculateMatrixValue = (adapter: WorkspacePackage): MatrixOutput => {
  let name = ''
  if (adapter.type === 'example') {
    name = `example-${adapter.descopedName}`
  } else {
    name = `${adapter.descopedName}`
  }
  return {
    name,
    type: adapter.type,
  }
}

export async function getJobMatrix(): Promise<JobMatrix> {
  let adapters = getWorkspacePackages([], process.env['UPSTREAM_BRANCH'])
  //legos will always change because it depends on all adapters, so ignore it when considering if we need to build all
  const shouldBuildAll =
    process.argv[2] === '-a' ||
    process.env['BUILD_ALL'] === 'true' ||
    adapters.find((p) => p.type === 'core' && !p.location.includes('lego'))
  // TODO below is commented out to test, revert before merge
  // || adapters.find(p => (p.type === "core" && !p.location.includes("lego")) || p.type === "scripts")

  // shouldBuildAll is forcefully set to true if we encounter a core or script change in the diff, so we have to explicitly
  // check if its true after evaluating the diff.
  if (shouldBuildAll) {
    console.log('Building all adapters')
    adapters = getWorkspacePackages() //Unfiltered list of all adapters{
  }

  return {
    adapter: adapters.map(calculateMatrixValue),
  }
}
