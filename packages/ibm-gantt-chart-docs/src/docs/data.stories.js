import { marked } from 'marked';

import accessors from './data_accessors.md';
import complexMappings from './data_complex_mappings.md';
import dates from './data_dates.md';
import fetchers from './data_fetchers.md';
import overview from './data_overview.md';
import timeWindow from './data_time_window.md';

import './github-markdown.css';

const renderMarkdown = (md) => `<div class="markdown-body" style="margin: 1rem;">${marked.parse(md)}</div>`;

export default {
  title: 'Guides/Data',
  parameters: { options: { showPanel: false } },
};

export const Overview = {
  render: () => renderMarkdown(overview),
};

export const DataFetchers = {
  render: () => renderMarkdown(fetchers),
};

export const DataAccessors = {
  render: () => renderMarkdown(accessors),
};

export const Dates = {
  render: () => renderMarkdown(dates),
};

export const ComplexMappings = {
  render: () => renderMarkdown(complexMappings),
};

export const TimeWindow = {
  render: () => renderMarkdown(timeWindow),
};
