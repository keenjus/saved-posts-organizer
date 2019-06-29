const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectRoot = path.join(__dirname, '../');

const sourceRootPath = path.join(projectRoot, '/src');
const distRootPath = path.join(projectRoot, '/dist');

module.exports = {
  entry: {
    popup: path.join(sourceRootPath, 'popup/popup.js'),
  },
  output: {
    path: distRootPath,
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(sourceRootPath, 'popup', 'popup.html'),
      inject: 'body',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin([
      {
        from: path.join(sourceRootPath, 'images'),
        to: path.join(distRootPath, 'images'),
      },
      {
        from: path.join(sourceRootPath, 'manifest.json'),
        to: path.join(distRootPath, 'manifest.json'),
        toType: 'file',
      },
    ]),
  ]
};