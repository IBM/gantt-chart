# Contributing to IBM Gantt Chart

### Requirements for development

- Recent [Node](https://nodejs.org/) and Npm installed. I currently use node v10.10.0 and npm v6.8.0
- Install [yarn](https://yarnpkg.com/) with `npm i -g yarn`
- Install [lerna](https://lernajs.io/) with `npm i -g lerna`

### How to develop?

1. Install required packages with `yarn install` (Don't pay attention to [unmet peer dependency](https://github.com/yarnpkg/yarn/issues/5810) warnings).

1. Link the different packages with `lerna link`

1. Go into the dev package. i.e. `cd packages/ibm-gantt-dev`

1. Start dev examples `yarn start`

1. Open https://localhost:8080/basic.html

Note: Build relies on [gda-scripts](https://github.com/gillesdandrea/gda-scripts) that provides (kind of) webpack presets and useful scripts (sort of [create-react-app](https://github.com/facebook/create-react-app) for libraries).

### How to publish?

1. Bump version of all packages with `lerna version` (necessary before building to inject the proper version number)

1. Build all packages `lerna run build:all`

1. Publish all packages `lerna publish from-package --no-git-reset`

### How to follow guidelines?

This projects follows a quite opinionated convention for formatting and linting. But don't worry, it's all automatic.
Use `yarn check:fix` to properly format your code and fix common issues (i.e. missing , ou ;) or `yarn check:list` to only list issues.

Note: a pre-commit script will enforce formatting and linting.

### Recommended extensions for [VS Code](https://code.visualstudio.com/)

Use the following extensions to automatically format files on save and display linting errors. Import sorting is manually triggered on `alt+command+o`

- ESLint [dbaeumer.vscode-eslint](https://github.com/Microsoft/vscode-eslint)
- stylelint [shinnn.stylelint](https://github.com/shinnn/vscode-stylelint)
- Prettier - Code formatter [esbenp.prettier-vscode](https://github.com/prettier/prettier-vscode)
- sort-imports [amatiasq.sort-imports](https://github.com/amatiasq/vsc-sort-imports)

You may use the following settings to configure the extensions:

#### settings.json

```
{
  "editor.formatOnSave": true,
  "editor.rulers": [120],
  "editor.tabSize": 2,
  "javascript.validate.enable": false,
  "eslint.autoFixOnSave": true,
  "stylelint.enable": true,
  "css.validate": false,
  "less.validate": false,
  "scss.validate": false,
  "prettier.eslintIntegration": true,
  "prettier.stylelintIntegration": true,
  "prettier.printWidth": 120,
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5",
  "sort-imports.on-save": false
}
```

#### keybinding.json

```
[
  {
    "key": "alt+cmd+o",
    "command": "sort-imports.sort"
  }
]
```
