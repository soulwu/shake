import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const srcPath = path.join(__dirname, 'src');
const distPath = path.join(__dirname, 'dist');

module.exports = {
  entry: {
    client: path.join(srcPath, 'client.js'),
    monitor: path.join(srcPath, 'monitor.js')
  },
  output: {
    path: distPath,
    publicPath: '/',
    filename: '[name]_[chunkhash].js',
    chunkFilename: '[name]_[chunkhash].js'
  },
  target: 'web',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: srcPath
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader',
        query: {limit: 10000}
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'client.ejs',
      inject: true,
      template: 'src/client.html',
      chunks: ['client']
    }),
    new HtmlWebpackPlugin({
      filename: 'monitor.html',
      inject: true,
      template: 'src/monitor.html',
      chunks: ['monitor']
    }),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('[name]_[contenthash].css'),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ]
};
