const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  context: path.join(__dirname, 'src'),
  entry: {
    test: './test.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
      },
    ],
  },
  target: 'web',
  externals: /^k6(\/.*)?/,
  stats: {
    colors: true,
  },
  optimization: {
    minimize: false,
  },
  plugins: [new CleanWebpackPlugin()],
}
