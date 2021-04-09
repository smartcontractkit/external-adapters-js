import * as fs from 'fs'
import * as yaml from 'yaml'
import { getWorkspacePackages, WorkspacePackages } from './workspace'

export function writeFile(): void {
  fs.writeFileSync('docker-compose.generated.yaml', generateFile())
}
export function generateFile(): string {
  const tag = process.env.TAG || 'latest'
  const prefix = process.env.IMAGE_PREFIX || ''
  return yaml.stringify(generateFileJSON({ prefix, tag }), { merge: true })
}

export function generateFileJSON(imageNameConfig: ImageNameConfig): Dockerfile {
  return makeDockerComposeFile(getWorkspacePackages(), imageNameConfig)
}

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

export interface ImageNameConfig {
  tag: string
  prefix: string
}

function makeDockerComposeFile(
  packages: WorkspacePackages,
  imageNameConfig: ImageNameConfig,
): Dockerfile {
  return {
    version: '3.9',
    services: packages.reduce<Record<string, Service>>((prev, next) => {
      prev[next.descopedName] = {
        image: generateImageName(next.descopedName, next.version, imageNameConfig),
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

function generateImageName(
  descopedName: string,
  version: string,
  { prefix, tag }: ImageNameConfig,
) {
  return `${prefix}${descopedName}:${tag}-${version}`
}
