import * as fs from 'fs'
import * as s from 'shelljs'
import * as yaml from 'yaml'

interface WorkspacePackage {
  location: string
  name: string
}
const VALID_ADAPTER_TYPES = ['composites', 'sources', 'examples', 'targets']
const scope = '@chainlink/'
const r = s
  .exec('yarn workspaces list --json')
  .split('\n')
  .filter(Boolean)
  .map((v) => JSON.parse(v))
  .map(({ location, name }: WorkspacePackage) => {
    const oas = s.cat(`${location}/oas.json`).toString()
    const envVars =
      oas && Object.keys(JSON.parse(oas)?.securityDefinitions?.['environment-variables'])
    return {
      location,
      name,
      descopedName: name.replace(scope, ''),
      type: location.split('/')[1],
      environment: envVars || [],
    }
  })
  .filter((v) => VALID_ADAPTER_TYPES.includes(v.type))

interface Service {
  image: string
  build: {
    context: string
    dockerfile: string
    args: Record<string, string>
  }
  environment: string[]
}

interface Dockerfile {
  version: string
  services: Record<string, Service>
}

function makeDockerComposeFile(packages: typeof r): Dockerfile {
  return {
    version: '3.9',
    services: packages.reduce<Record<string, Service>>((prev, next) => {
      prev[next.descopedName] = {
        image: `${next.descopedName}${getTag()}`,
        build: {
          context: '.',
          dockerfile: './Dockerfile',
          args: {
            location: next.location,
            package: next.name,
          },
        },
        environment: next.environment,
      }

      return prev
    }, {}),
  }
}

function getTag() {
  const tag = process.env.TAG || 'latest'
  return `:${tag}`
}

fs.writeFileSync(
  'docker-compose.generated.yaml',
  yaml.stringify(makeDockerComposeFile(r), { merge: true }),
)
