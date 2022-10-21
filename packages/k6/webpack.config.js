const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  target: 'node',
  devtool: 'source-map',
  context: path.join(__dirname, 'src'),
  entry: {
    test: './test.ts',
    reproTest: './repro-test.ts',
    testLimits: './test-limits.ts',
    testLimitsMultiple: './test-limits-multiple.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      child_process: false,
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
      },
    ],
  },
  externals: /^k6(\/.*)?/,
  stats: {
    colors: true,
  },
  optimization: {
    minimize: false,
  },
  plugins: [new CleanWebpackPlugin()],
}
