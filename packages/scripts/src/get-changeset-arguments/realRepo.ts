import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { Repo } from './repo'

const PACKAGES_DIR = 'packages'
const CHANGESET_DIR = '.changeset'
const ADAPTER_PACKAGE_RE = /^'(@chainlink\/[^']*-adapter)': (major|minor|patch)$/gm

function getPackageJsonPath(packageName: string): string | null {
  try {
    const out = execSync(`git grep -l '"name": "${packageName}"' ${PACKAGES_DIR}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    const first = out.trim().split('\n')[0]
    return first || null
  } catch {
    return null
  }
}

function findPackageJsonWithDependency(packageName: string): string[] {
  try {
    const out = execSync(
      `git grep -l '"${packageName}": "' ${PACKAGES_DIR}/*/*/package.json 2>/dev/null || true`,
      { encoding: 'utf-8', stdio: 'pipe' },
    )
    return out.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function parsePackagesFromChangesetContent(content: string): string[] {
  const re = new RegExp(ADAPTER_PACKAGE_RE.source, 'gm')
  const packages = [...content.matchAll(re)].map((m) => m[1])
  return [...new Set(packages)]
}

export function createRealRepo(): Repo {
  return {
    packageExists(packageName: string): boolean {
      return getPackageJsonPath(packageName) !== null
    },

    getDependencies(packageName: string): string[] {
      const packageFile = getPackageJsonPath(packageName)
      if (!packageFile) return []
      const pkgJson = JSON.parse(fs.readFileSync(packageFile, 'utf-8'))
      const deps = (pkgJson.dependencies && Object.keys(pkgJson.dependencies)) || []
      const chainlinkDeps = deps.filter((d: string) => d.startsWith('@chainlink/'))
      return chainlinkDeps.filter((d: string) => getPackageJsonPath(d) !== null)
    },

    getPackagesThatDependOn(packageName: string): string[] {
      const packageFiles = findPackageJsonWithDependency(packageName)
      const names = packageFiles.flatMap((f) => {
        const pkgJson = JSON.parse(fs.readFileSync(f, 'utf-8'))
        return pkgJson.dependencies?.[packageName] ? [pkgJson.name] : []
      })
      return [...new Set(names)].sort()
    },

    getPackagesFromChangesetFiles(files?: string[]): string[] {
      const toSearch =
        files ??
        fs
          .readdirSync(CHANGESET_DIR)
          .filter((f) => f.endsWith('.md') && f !== 'README.md')
          .map((f) => path.join(CHANGESET_DIR, f))
      const allPackages = toSearch.flatMap((file) =>
        parsePackagesFromChangesetContent(fs.readFileSync(file, 'utf-8')),
      )
      return [...new Set(allPackages)].sort()
    },

    getChangesetFilesMentioningPackage(packageName: string): string[] {
      try {
        const out = execSync(
          `git grep -lE "^'${packageName}': (major|minor|patch)" ${CHANGESET_DIR}`,
          { encoding: 'utf-8', stdio: 'pipe' },
        )
        return out.trim().split('\n').filter(Boolean)
      } catch {
        return []
      }
    },

    getAllWorkspacePackageNames(): string[] {
      const out = execSync('yarn workspaces list --json', {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line: string) => JSON.parse(line).name)
        .filter((name: string) => name !== '@chainlink/external-adapters-js')
    },
  }
}
