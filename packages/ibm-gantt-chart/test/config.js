//
// Configure SystemJS
//
SystemJS.config({
  // set our baseURL reference path
  baseURL: '../../src',
  defaultJSExtensions: true,
  // Transpilation JS6 to JS5
  map: {
    '*': '*.js',
    'plugin-babel': '../../../node_modules/systemjs-plugin-babel/plugin-babel.js',
    'add-module-exports': '../../../node_modules/babel-plugin-add-module-exports/lib/index.js',
    'systemjs-babel-build': '../../../node_modules/systemjs-plugin-babel/systemjs-babel-browser.js',
  },
  meta: {
    '*/jquery/dist/*': {
      build: false,
    },
  },
  transpiler: 'plugin-babel',
});

const jqueryReady = new Promise((resolve, reject) => {
  $(document).ready(resolve);
});

const systemJSReady = SystemJS.import('ibm-gantt-chart-jquery')
  .then(result => {
    // Cannot be done with babel-plugin-add-module-exports as for the webpack build, does not work with system.js..
    window.Gantt = result.default;
  })
  .catch(console.log.bind(console));

Promise.all([jqueryReady, systemJSReady]).then(() => {
  mocha.run();
});

// To run only one test, just do:
// it.only(...)
