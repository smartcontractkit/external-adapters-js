import { getWorkspaceAdapters, getWorkspacePackages, WorkspaceAdapter } from '../workspace'

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

const calculateMatrixValue = (adapter: WorkspaceAdapter): MatrixOutput => {
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
  // Always build all when specifically instructed, or when something in core or scripts has changed
  const shouldBuildAll =
    process.argv[2] === '-a' ||
    process.env['BUILD_ALL'] === 'true' ||
    getWorkspacePackages(process.env['UPSTREAM_BRANCH']).find(
      (p) => p.type === 'core' || p.type === 'scripts',
    )

  const adapters = shouldBuildAll
    ? getWorkspaceAdapters() //Unfiltered list of all adapters
    : getWorkspaceAdapters([], process.env['UPSTREAM_BRANCH'])

  return {
    adapter: adapters.map(calculateMatrixValue),
  }
}
