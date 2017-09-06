const version = require('./package').version;
const production = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 80; //(production ? 80 : 8080);

module.exports = {
  production,
  host: '0.0.0.0', //production ? '0.0.0.0' : 'localhost',
  port: port,
  static: {
    root: `/static/${version}`,
    suffix: production ? '.gz' : ''
  },
  hostAndPortForPassport: process.env.oauth_base_url || 'http://localhost:3000'
};