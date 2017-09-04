const version    = require('./package').version;
const production = process.env.NODE_ENV === 'production';

module.exports = {
  production,
  host: '0.0.0.0', //production ? '0.0.0.0' : 'localhost',
  port: 8080, // production ? 80 : 8080
  static: {
    root: `/static/${version}`,
    suffix: production ? '.gz' : ''
  },
  hostAndPortForPassport: process.env.HOST_PORT || 'http://localhost:3000'
};
