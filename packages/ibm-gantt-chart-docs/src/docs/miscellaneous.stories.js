import { marked } from 'marked';

import palettes from './palettes.md';
import renderers from './renderers.md';
import selection from './selection.md';

import './github-markdown.css';

const renderMarkdown = (md) => `<div class="markdown-body" style="margin: 1rem;">${marked.parse(md)}</div>`;

export default {
  title: 'Guides/Miscellaneous',
  parameters: { options: { showPanel: false } },
};

export const HandlingSelection = {
  render: () => renderMarkdown(selection),
};

export const Renderers = {
  render: () => renderMarkdown(renderers),
};

export const Palettes = {
  render: () => renderMarkdown(palettes),
};
