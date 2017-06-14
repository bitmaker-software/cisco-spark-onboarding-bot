const webpack = require('webpack');

module.exports = env => {
  const dev = env ? env.dev : false;
  return {
    entry: {
      app: dev ? [
        // 'react-hot-loader/patch',
        'webpack-hot-middleware/client?reload=true',
        './scripts/app.js'
      ] : [
        './scripts/app.js'
      ],
      main: './scripts/main.js',
      test: './scripts/test.js',
      gdrive: './scripts/gdrive.js',
      settings: './scripts/settings.js',
      manager_flows: "./scripts/manager_flows.js",
      manager_flow_steps: "./scripts/manager_flow_steps.js",
      manager_flow_send: "./scripts/manager_flow_send.js",
    },

    output: {
      publicPath: env ? env.publicPath : '',
      path: `${__dirname}/public`,
      filename: 'js/[name].js'
    },
    context: `${__dirname}/client`,
    devtool: dev ? 'inline-source-map' : 'hidden-source-map',

    module: {
      rules: [{
        test: /\.js$/,
        loaders: [{
          loader: 'babel-loader',
          query: {
            presets: [['es2015', {modules: false}], 'stage-2'],// 'react'],
            // plugins: dev ? ['react-hot-loader/babel'] : undefined
          }
        }],
        exclude: /node_modules/
      }],
    },

    // plugins: [
    //  //dev and prod
    //
    // ].concat(dev ? [

    plugins: dev ? [
      new webpack.ProvidePlugin({
        // $: 'jquery',
        // jQuery: 'jquery',
        // 'window.$': 'jquery',
        // vue: 'vue/dist/vue',
        // draggable: 'draggable',
        // bootstrap: 'bootstrap'
      }),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    ] : [
      new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}}),
      new webpack.optimize.UglifyJsPlugin({
        compress: {warnings: false}, output: {comments: false}, sourceMap: true
      })
    ]//)
  };
};
