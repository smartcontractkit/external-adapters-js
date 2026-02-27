import * as fs from 'fs'
import * as path from 'path'
import { createRepoFromStructure, type Repo, type RepoStructure } from './repo'

const PACKAGES_DIR = 'packages'
const CHANGESET_DIR = '.changeset'
const ADAPTER_PACKAGE_RE = /^'(@chainlink\/[^']*)': (major|minor|patch)$/gm

function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        results.push(...findPackageJsonFiles(full))
      }
    } else if (entry.name === 'package.json') {
      results.push(full)
    }
  }
  return results
}

function parsePackagesFromChangesetContent(content: string): string[] {
  const re = new RegExp(ADAPTER_PACKAGE_RE.source, 'gm')
  const packages = [...content.matchAll(re)].map((m) => m[1])
  return [...new Set(packages)]
}

// Discovers packages and changesets from the current working directory.
export function discoverRepoStructure(): RepoStructure {
  const packageJsonPaths = findPackageJsonFiles(PACKAGES_DIR)
  const allPackageNames = new Set<string>()
  const dependencies: Record<string, string[]> = {}

  for (const filePath of packageJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const name = pkg?.name
    if (!name || typeof name !== 'string') {
      throw new Error(`Invalid package.json at ${filePath}: missing or invalid "name" field`)
    }
    allPackageNames.add(name)
    if (!pkg.dependencies || typeof pkg.dependencies !== 'object') {
      throw new Error(
        `Invalid package.json at ${filePath}: missing or invalid "dependencies" field`,
      )
    }
    dependencies[name] = Object.keys(pkg.dependencies)
  }

  // Restrict dependencies to packages that exist in the repo
  const dependenciesInRepo: Record<string, string[]> = {}
  for (const [pkg, deps] of Object.entries(dependencies)) {
    dependenciesInRepo[pkg] = deps.filter((d) => allPackageNames.has(d))
  }

  const changesetFiles = fs
    .readdirSync(CHANGESET_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
  const changesets: Record<string, string[]> = {}
  for (const file of changesetFiles) {
    const content = fs.readFileSync(path.join(CHANGESET_DIR, file), 'utf-8')
    changesets[file] = parsePackagesFromChangesetContent(content)
  }

  return {
    dependencies: dependenciesInRepo,
    changesets,
  }
}

/** Build a Repo by discovering package.json and changeset files on disk (no git/yarn). */
export function createRealRepo(): Repo {
  const structure = discoverRepoStructure()
  return createRepoFromStructure(structure)
}
