import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import '../stories.scss';

function createRowLayoutGanttConfig() {
  var nowMillis = new Date(2016, 7, 8, 8, 0, 0, 0).getTime();

  function makeDate(num) {
    return nowMillis + num * 12 * 60 * 60 * 1000;
  }

  function createActivityDuplicates(workers, ctx) {
    var gantt = ctx.gantt;
    gantt.rowLayoutMode = null;
    var worker, assigns, assign;
    var maxSubRows = 3;
    var results = [];
    for (var i = 0; i < workers.length; i++) {
      worker = workers[i];
      results.push(worker);
      assigns = worker.ASSIGNMENTS;
      var newAssigns = [];
      for (var iAssign = 0, assignCount = assigns ? assigns.length : 0; iAssign < assignCount; iAssign++) {
        assign = assigns[iAssign];
        newAssigns.push(assign);
        for (var iCp = 0, copyCount = maxSubRows - (iAssign % maxSubRows) - 1; iCp < copyCount; iCp++) {
          // for(var iCp = 0, copyCount = 1; iCp < copyCount; iCp++) {
          newAssigns.push($.extend({}, assign));
        }
      }
      worker.ASSIGNMENTS = newAssigns;
    }
    return results;
  }

  return {
    data: {
      resources: {
        url: 'house_building/workers.json',
        success: createActivityDuplicates,
        parent: 'PARENT_ID',
        id: 'OBJECT_ID',
        activities: 'ASSIGNMENTS',
        name: 'NAME',
      },
      activities: {
        start(assignment) {
          return makeDate(assignment.START);
        },
        end(assignment) {
          return makeDate(assignment.END);
        },
        name: 'TASK.NAME',
      },
    },
    timeTable: {
      layout: {
        strategy(ctx) {
          return ctx.gantt.rowLayoutMode; // Returns either an empty string for the default layout, "logistic" for the logistic layout or "tile" for the tile layout.
        },
      },
      renderer: {
        text(activity) {
          return activity.TASK.NAME;
        },
        background: {
          getValue: 'TASK.NAME',
        },
        color: 'automatic',
      },
    },
    toolbar: [
      'title',
      // User specific toolbar components
      {
        type: 'select',
        text: 'Row layout',
        options: [
          { value: '', text: 'Default' },
          { value: 'logistic', text: 'Logistic' },
          { value: 'tile', text: 'Tile' },
        ],
        onchange(value, ctx) {
          var gantt = ctx.gantt;
          gantt.rowLayoutMode = value;
          gantt.draw();
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
    ],
    title: 'Row layout example',
  };
}

storiesOf('Storybook|Examples', module).add('Row Layout', () => {
  setTimeout(() => {
    new Gantt('gantt', createRowLayoutGanttConfig()); // eslint-disable-line no-new
  }, 0);
  return '<div id="gantt"></div>';
});
