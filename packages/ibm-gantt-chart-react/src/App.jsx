import React from 'react';

import { createRoot } from 'react-dom/client';

import GanttChart from './components/GanttChart/GanttChart';

import { nursesConfig } from './data/nurses';

import './App.scss';

const config = nursesConfig;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<GanttChart config={config} />);
}
