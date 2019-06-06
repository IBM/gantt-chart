// Karma configuration
// Generated on Wed Oct 12 2016 19:10:29 GMT-0700 (Pacific Daylight Time)

module.exports = function karma(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      '../../node_modules/jquery/dist/jquery.min.js',
      '../../node_modules/datatables.net/js/jquery.dataTables.js',
      '../../node_modules/vis/dist/vis.min.js',
      '../../node_modules/mocha/mocha.css',

      'dist/ibm-gantt-chart-jquery.js',

      // { pattern: 'dist/images/**/*.*', included: false },
      { pattern: 'dist/fonts/**/*.*', included: false },
      { pattern: 'dist/*.map', included: false },
      { pattern: 'data/**/*.*', included: false },
      // { pattern: 'images/**/*.*', included: false },
      // { pattern: 'test/images/**/*.*', included: false },

      /* http://www.mattjmorrison.com/today-i-learned/2014/09/24/learned.html */
      { pattern: '../../node_modules/datatables.net-dt/css/jquery.dataTables.css', included: false },
      { pattern: '../../node_modules/datatables.net-dt/images/*.*', included: false },
      { pattern: '../../node_modules/vis/dist/vis.min.css', included: false },
      { pattern: '../../node_modules/mocha/mocha.css', included: false },
      { pattern: 'dist/ibm-gantt-chart-jquery.css', included: false },

      '../../node_modules/chai/chai.js',
      'test/testbase.js',
      'test/table/*.js',
      'test/**/*.test.js',
    ],

    // list of files to exclude
    exclude: [
      /* 'test/node_modules/!**!/!*.test.js', */
      'test/config.js',
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    proxies: {
      '../../data/': '/base/test/images/',
    },
  });
};
