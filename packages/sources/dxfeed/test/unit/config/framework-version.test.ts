import * as fs from 'fs'
import * as path from 'path'

/**
 * Plan item 2's proving test (spec suggested_implementation: "Framework version
 * MUST resolve >= 2.20.0 — customSubscriptionMessages does not exist in the
 * stale unplugged 2.16.1 copy"). The version is read from the package the
 * module resolver ACTUALLY loads at runtime — not from this package.json's
 * dependency pin — so a stale unplugged/hoisted copy fails here even when the
 * pin looks right.
 */
const FRAMEWORK = '@chainlink/external-adapter-framework'

const installedFrameworkVersion = (): string => {
  // Yarn PnP (this repo's nodeLinker) resolves the deep subpath and loads the
  // JSON out of the zip archive the package lives in; a node_modules install
  // resolves the same specifier through the directory tree
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`${FRAMEWORK}/package.json`).version
  } catch {
    // Fallback: walk up from the resolved runtime entry to the owning
    // package.json (works when the specifier above is blocked by an exports map)
    const entry = require.resolve(FRAMEWORK)
    let dir = path.dirname(entry)
    while (dir !== path.parse(dir).root) {
      const candidate = path.join(dir, 'package.json')
      if (fs.existsSync(candidate)) {
        const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'))
        if (pkg.name === FRAMEWORK) {
          return pkg.version
        }
      }
      dir = path.dirname(dir)
    }
    throw new Error(`Could not locate the installed ${FRAMEWORK} package.json`)
  }
}

/** Minimal semver comparison for the framework's x.y.z release versions. */
const atLeast = (version: string, major: number, minor: number): boolean => {
  const [vMajor, vMinor] = version.split('.').map((segment) => parseInt(segment, 10))
  if (Number.isNaN(vMajor) || Number.isNaN(vMinor)) {
    throw new Error(`Unparseable framework version: ${version}`)
  }
  return vMajor > major || (vMajor === major && vMinor >= minor)
}

describe('framework version (spec suggested_implementation / plan item 2)', () => {
  it('resolves the installed @chainlink/external-adapter-framework at >= 2.20.0 (customSubscriptionMessages exists only from 2.20.0)', () => {
    const version = installedFrameworkVersion()

    // The resolution must not silently fall back to the adapter's own package
    expect(version).not.toBe('2.8.7')
    expect(atLeast(version, 2, 20)).toBe(true)
  })
})
