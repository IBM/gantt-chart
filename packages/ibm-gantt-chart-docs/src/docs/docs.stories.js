/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */

import marked from 'marked';

import { storiesOf } from '@storybook/html';

import './github-markdown.css';

const title = 'Guides';
const chapters = [
  {
    title: 'Introduction',
    pages: [
      { title: 'Getting started', md: require('../../../ibm-gantt-chart/README.md') },
      { title: 'Overview', md: require('.//overview.md') },
      { title: 'Concepts', md: require('.//concepts.md') },
    ],
  },
  {
    title: 'Data',
    pages: [
      { title: 'Overview', md: require('.//data_overview.md') },
      { title: 'Data Fetchers', md: require('.//data_fetchers.md') },
      { title: 'Data Accessors', md: require('.//data_accessors.md') },
      { title: 'Dates', md: require('.//data_dates.md') },
      { title: 'Complex Mappings', md: require('.//data_complex_mappings.md') },
      { title: 'Time Window', md: require('.//data_time_window.md') },
    ],
  },
  {
    title: 'Time Line',
    pages: [
      { title: 'Overview', md: require('.//time_line_overview.md') },
      { title: 'Activity Rendering', md: require('.//time_line_activity_rendering.md') },
      { title: 'Activities Layout', md: require('.//time_line_activities_layout.md') },
      { title: 'Decorations / break', md: require('.//time_line_decorations.md') },
      { title: 'Drag-n-Drop', md: require('.//time_line_dragdrop.md') },
    ],
  },
  {
    title: 'Miscellaneous',
    pages: [
      { title: 'Handling Selection', md: require('.//selection.md') },
      { title: 'Renderers', md: require('.//renderers.md') },
      { title: 'Palettes', md: require('.//palettes.md') },
    ],
  },
];

chapters.forEach(chapter => {
  const story = storiesOf(`${title}|${chapter.title}`, module).addParameters({ options: { showPanel: false } });
  chapter.pages.forEach(page => {
    story.add(page.title, () => `<div class="markdown-body" style="margin: 1rem;">${marked(page.md)}</div>`);
  });
});
