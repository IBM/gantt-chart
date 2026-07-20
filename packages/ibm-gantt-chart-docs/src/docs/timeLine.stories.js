import { marked } from 'marked';

import activitiesLayout from './time_line_activities_layout.md';
import activityRendering from './time_line_activity_rendering.md';
import decorations from './time_line_decorations.md';
import dragDrop from './time_line_dragdrop.md';
import overview from './time_line_overview.md';

import './github-markdown.css';

const renderMarkdown = (md) => `<div class="markdown-body" style="margin: 1rem;">${marked.parse(md)}</div>`;

export default {
  title: 'Guides/Time Line',
  parameters: { options: { showPanel: false } },
};

export const Overview = {
  render: () => renderMarkdown(overview),
};

export const ActivityRendering = {
  render: () => renderMarkdown(activityRendering),
};

export const ActivitiesLayout = {
  render: () => renderMarkdown(activitiesLayout),
};

export const DecorationsBreak = {
  render: () => renderMarkdown(decorations),
};

export const DragNDrop = {
  render: () => renderMarkdown(dragDrop),
};
