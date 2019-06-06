import React from 'react';

import { storiesOf } from '@storybook/react'; // eslint-disable-line import/no-extraneous-dependencies

import GanttChart from './GanttChart';

const data = [
  {
    id: 'NURSES+Anne',
    name: 'Anne',
    activities: [
      {
        id: 'SHIFTS+Emergency+Monday+2+8',
        name: 'Emergency',
        start: 1474880400000,
        end: 1474902000000,
      },
    ],
  },
  {
    id: 'NURSES+Bethanie',
    name: 'Bethanie',
    activities: [],
  },
  {
    id: 'NURSES+Betsy',
    name: 'Betsy',
    activities: [
      {
        id: 'SHIFTS+Emergency+Wednesday+12+18',
        name: 'Emergency',
        start: 1475089200000,
        end: 1475110800000,
      },
      {
        id: 'SHIFTS+Emergency+Saturday+12+20',
        name: 'Emergency',
        start: 1475348400000,
        end: 1475377200000,
      },
      {
        id: 'SHIFTS+Consultation+Friday+8+12',
        name: 'Consultation',
        start: 1475247600000,
        end: 1475262000000,
      },
    ],
  },
  {
    id: 'NURSES+Cathy',
    name: 'Cathy',
    activities: [
      {
        id: 'SHIFTS+Emergency+Sunday+20+2',
        name: 'Emergency',
        start: 1475463600000,
        end: 1475485200000,
      },
      {
        id: 'SHIFTS+Emergency+Saturday+12+20',
        name: 'Emergency',
        start: 1475348400000,
        end: 1475377200000,
      },
      {
        id: 'SHIFTS+Emergency+Monday+18+2',
        name: 'Emergency',
        start: 1474938000000,
        end: 1474966800000,
      },
    ],
  },
  {
    id: 'NURSES+Cindy',
    name: 'Cindy',
    activities: [
      {
        id: 'SHIFTS+Emergency+Saturday+20+2',
        name: 'Emergency',
        start: 1475377200000,
        end: 1475398800000,
      },
      {
        id: 'SHIFTS+Consultation+Friday+8+12',
        name: 'Consultation',
        start: 1475247600000,
        end: 1475262000000,
      },
      {
        id: 'SHIFTS+Consultation+Tuesday+8+12',
        name: 'Consultation',
        start: 1474988400000,
        end: 1475002800000,
      },
    ],
  },
];
const config = {
  data: {
    // Configures how to fetch resources for the Gantt
    resources: {
      data, // resources are provided in an array. Instead, we could configure a request to the server.
      // Activities of the resources are provided along with the 'activities' property of resource objects.
      // Alternatively, they could be listed from the 'data.activities' configuration.
      activities: 'activities',
      name: 'name', // The name of the resource is provided with the name property of the resource object.
      id: 'id', // The id of the resource is provided with the id property of the resource object.
    },
    // Configures how to fetch activities for the Gantt
    // As activities are provided along with the resources, this section only describes how to create
    // activity Gantt properties from the activity model objects.
    activities: {
      start: 'start', // The start of the activity is provided with the start property of the model object
      end: 'end', // The end of the activity is provided with the end property of the model object
      name: 'name', // The name of the activity is provided with the name property of the model object
    },
  },
  // Configure a toolbar associated with the Gantt
  toolbar: [
    'title',
    'search',
    'separator',
    {
      type: 'button',
      text: 'Refresh',
      fontIcon: 'fa fa-refresh fa-lg',
      onclick(ctx) {
        ctx.gantt.draw();
      },
    },
    'fitToContent',
    'zoomIn',
    'zoomOut',
  ],
  title: 'Simple Gantt', // Title for the Gantt to be displayed in the toolbar
};

storiesOf('Components|GanttChart', module).add('default', () => <GanttChart config={config} />);
