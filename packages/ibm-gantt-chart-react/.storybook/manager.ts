import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming'
import { version } from '../package.json'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: `ibm-gantt-chart-react@${version}`,
    brandUrl: 'https://github.com/ibm/gantt-chart',
  }),
})
