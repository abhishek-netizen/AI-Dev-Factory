const config = require('./appium-config.json');

exports.config = {
  runner:    'local',
  port:       4723,
  path:      '/wd/hub',

  specs: ['./tests/ios/**/*.spec.js'],

  capabilities: [{
    ...config.ios,
  }],

  logLevel:           'info',
  bail:               0,
  waitforTimeout:     15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount:   3,

  framework:  'mocha',
  reporters:  ['spec'],

  mochaOpts: {
    ui:      'bdd',
    timeout: 60000,
  },
};
