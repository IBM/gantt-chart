// import '@babel/polyfill';

import Gantt from 'ibm-gantt-chart';

// useless with mainFields: ['source'],
// import 'ibm-gantt-chart/dist/ibm-gantt-chart.css';

var activityData = [
  {
    OBJ_ID: 'NURSES+Anne',
    NAME: 'Anne',
    START: 1646162596336,
    END: 1646165596336,
    PARENT_ID: null,
    COLOR: '#FF0000',
    URL: 'https://example.com/?link-to-anne',
  },
  {
    OBJ_ID: 'NURSES+Bethanie',
    NAME: 'Bethanie',
    START: 1646163596336,
    END: 1646164596336,
    PARENT_ID: 'NURSES+Anne',
    COLOR: '#0000FF',
    URL: 'https://example.com/?link-to-bethanie',
  },
  {
    OBJ_ID: 'NURSES+Betsy',
    NAME: 'Betsy',
    START: 1646164596336,
    END: 1646165596336,
    PARENT_ID: 'NURSES+Bethanie',
    COLOR: '#FFA500',
    URL: 'https://example.com/?link-to-betsy',
  },
  {
    OBJ_ID: 'NURSES+Cathy',
    NAME: 'Cathy',
    START: 1646163596336,
    END: 1646165596336,
    parent: null,
    COLOR: '#008000',
    URL: 'https://example.com/?link-to-cathy',
  },
  {
    OBJ_ID: 'NURSES+Cindy',
    NAME: 'Cindy',
    START: 1646164596336,
    END: 1646165596336,
    PARENT_ID: 'NURSES+Cathy',
    COLOR: '#FFFF00',
    URL: 'https://example.com/?nurse=link-to-cindy',
  },
];

function createActivitiesGanttConfig() {
  return {
    data: {
      activities: {
        data: activityData,
        parent: 'PARENT_ID',
        id: 'OBJ_ID',
        name: 'NAME',
        start: 'START',
        end: 'END',
      },
    },
    timeTable: {
      renderer: [
        {
          background: (a, b) => a.getData().COLOR,
          color: (a, b) => '#ffffff',
          textOverflow: 'cut',
        },
      ],
    },
    type: Gantt.type.ACTIVITY_CHART,
    toolbar: [
      'title',
      {
        type: 'button',
        text: 'Refresh',
        fontIcon: 'fa fa-refresh fa-lg',
        onclick(ctx) {
          location.reload();
        },
      },
      'separator',
      'search',
      'separator',
      'mini',
      'separator',
      'fitToContent',
      'zoomIn',
      'zoomOut',
      'separator',
    ],
    title: 'Riot Games',
  };
}

new Gantt('gantt' /* the id of the DOM element to contain the Gantt chart */, createActivitiesGanttConfig());
