import { addons } from '@storybook/manager-api'
import { create } from '@storybook/theming'
import { homepage, version } from '../package.json'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: `ibm-gantt-chart-svelte@${version}`,
    brandUrl: homepage,
  }),
})
