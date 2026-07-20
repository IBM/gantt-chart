import type { Meta, StoryObj } from '@storybook/svelte'
import GanttChart from '../lib/GanttChart.svelte'
import { nursesConfig } from '../lib/fixtures/nurses'

const meta = {
  title: 'Components/GanttChart',
  component: GanttChart,
  tags: ['autodocs'],
} satisfies Meta<GanttChart>

export default meta
type Story = StoryObj<typeof meta>

const baseConfig = nursesConfig

export const Default: Story = {
  args: {
    config: baseConfig,
    style: 'height: 600px;',
  },
}

export const WithStringClass: Story = {
  args: {
    config: baseConfig,
    class: 'my-custom-gantt',
    style: 'height: 600px;',
  },
}

export const WithArrayClass: Story = {
  args: {
    config: baseConfig,
    class: ['class-a', 'class-b'],
    style: 'height: 600px;',
  },
}

export const WithObjectClass: Story = {
  args: {
    config: baseConfig,
    class: { 'my-gantt': true, 'is-active': true, 'is-hidden': false },
    style: 'height: 600px;',
  },
}

export const WithStringStyle: Story = {
  args: {
    config: baseConfig,
    style: 'height: 600px;',
  },
}

export const WithObjectStyle: Story = {
  args: {
    config: baseConfig,
    style: { height: '600px', border: '1px solid #ccc' },
  },
}

export const CustomPalette: Story = {
  args: {
    config: {
      ...baseConfig,
      palette: ['#e71d32', '#ff7832', '#f4c100', '#8cd211', '#00b29e', '#4178be', '#9855d4'],
    },
    style: 'height: 600px;',
  },
}
