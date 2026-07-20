import { marked } from 'marked';

import gettingStarted from '../../../ibm-gantt-chart/README.md';
import concepts from './concepts.md';
import overview from './overview.md';

import './github-markdown.css';

const renderMarkdown = (md) => `<div class="markdown-body" style="margin: 1rem;">${marked.parse(md)}</div>`;

export default {
  title: 'Guides/Introduction',
  parameters: { options: { showPanel: false } },
};

export const GettingStarted = {
  render: () => renderMarkdown(gettingStarted),
};

export const Overview = {
  render: () => renderMarkdown(overview),
};

export const Concepts = {
  render: () => renderMarkdown(concepts),
};
