import Gantt from 'ibm-gantt-chart';

import '../stories.scss';

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
        end: 1475406000000,
      },
      {
        id: 'SHIFTS+Emergency+Tuesday+12+18',
        name: 'Emergency',
        start: 1475175600000,
        end: 1475197200000,
      },
      {
        id: 'SHIFTS+Consultation+Wednesday+8+12',
        name: 'Consultation',
        start: 1475127600000,
        end: 1475142000000,
      },
      {
        id: 'SHIFTS+Emergency+Monday+8+12',
        name: 'Emergency',
        start: 1474894800000,
        end: 1474909200000,
      },
    ],
  },
];

const config = {
  data: {
    resources: { data, activities: 'activities', name: 'name', id: 'id' },
    activities: { start: 'start', end: 'end', name: 'name' },
  },
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

export default {
  title: 'Storybook/Examples',
};

export const Basic = {
  render: () => {
    setTimeout(() => {
      const gantt = new Gantt('gantt', config);
    }, 0);
    return '<div id="gantt"></div>';
  },
};
