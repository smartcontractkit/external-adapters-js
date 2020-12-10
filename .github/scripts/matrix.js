const adapters = require(`${process.env.GITHUB_WORKSPACE}/.github/strategy/adapters.json`)

module.exports = () => {
  const replace = (s, v) => s.replace(/__ADAPTER__/g, v)
  const result = Object.entries(adapters)
    .map(([k, v]) =>
      v.adapter.map((a) => ({
        name: a,
        asset_path: replace(v.asset_path, a),
        asset_name: replace(v.asset_name, a),
        cmd: replace(v.cmd, a),
        docker: replace(v.docker, a),
        type: k,
      })),
    )
    .flat()

  return { adapter: result }
}
