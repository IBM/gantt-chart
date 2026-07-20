import GanttChart from '../components/GanttChart/GanttChart';

import { nursesConfig } from '../data/nurses';

const meta = {
  title: 'Components/GanttChart',
  component: GanttChart,
  tags: ['autodocs'],
  args: {
    style: { height: '600px' },
  },
};

export default meta;

const baseConfig = nursesConfig;

export const Default = {
  args: {
    config: baseConfig,
  },
};

export const WithStringClass = {
  args: {
    config: baseConfig,
    className: 'my-custom-gantt',
  },
};

export const WithArrayClass = {
  args: {
    config: baseConfig,
    className: ['class-a', 'class-b'],
  },
};

export const WithObjectClass = {
  args: {
    config: baseConfig,
    className: { 'my-gantt': true, 'is-active': true, 'is-hidden': false },
  },
};

export const WithStringStyle = {
  args: {
    config: baseConfig,
    style: 'height: 600px;',
  },
};

export const WithObjectStyle = {
  args: {
    config: baseConfig,
    style: { height: '600px', border: '1px solid #ccc' },
  },
};

export const CustomPalette = {
  args: {
    config: {
      ...baseConfig,
      palette: ['#e71d32', '#ff7832', '#f4c100', '#8cd211', '#00b29e', '#4178be', '#9855d4'],
    },
  },
};
