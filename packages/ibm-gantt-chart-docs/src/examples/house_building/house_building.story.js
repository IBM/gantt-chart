import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import '../stories.scss';
import './house_building.css';

function createHouseBuildingGanttConfig() {
  const nowMillis = new Date(2016, 7, 8, 8, 0, 0, 0).getTime();
  function makeDate(num) {
    return nowMillis + num * 12 * 60 * 60 * 1000;
  }

  function processHouseTimeWindows(workers, settings) {
    const gantt = settings.gantt;
    gantt.colorMode = 'showTasks';
    gantt.houseTimeWindows = {};
    let assigns, assign, iAssign, wnd;
    for (let iWorker = 0, count = workers.length; iWorker < count; ++iWorker) {
      if ((assigns = workers[iWorker].ASSIGNMENTS)) {
        for (iAssign = 0; iAssign < assigns.length; ++iAssign) {
          assign = assigns[iAssign];
          if (!(wnd = gantt.houseTimeWindows[assign.HOUSE])) {
            gantt.houseTimeWindows[assign.HOUSE] = { start: assign.START, end: assign.END };
          } else {
            if (wnd.start > assign.START) wnd.start = assign.START;
            if (wnd.end < assign.END) wnd.end = assign.END;
          }
        }
      }
    }
    Object.keys(gantt.houseTimeWindows).forEach(function(house) {
      gantt.houseTimeWindows[house].start = makeDate(gantt.houseTimeWindows[house].start);
      gantt.houseTimeWindows[house].end = makeDate(gantt.houseTimeWindows[house].end);
    });
    return workers;
  }

  return {
    data: {
      resources: {
        url: 'house_building/workers.json',
        success: processHouseTimeWindows,
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
      renderer: [
        {
          selector(object, ctx) {
            return ctx.gantt.colorMode === 'showTasks';
          },
          text(activity) {
            if (activity == null || activity.TASK == null) {
              console.log('NULL task!');
            }
            return activity.TASK.NAME;
          },
          textOverflow: 'noDisplay',
          background: {
            // values : [ 'facade', 'ceiling', 'windows', 'moving', 'masonry', 'carpentry', 'roofing', 'plumbing', 'painting', 'garden' ],
            // palette : ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"],
            palette: ['#5aa8f8', '#4178bc', '#8cd211', '#c8f08f', '#ba8ff7', '#a6266e', '#ff7832'],
            getValue: 'TASK.NAME',
          },
          color: 'automatic',
          tooltipProperties(activity, ctx) {
            const props = ['Start', new Date(activity.start).format(), 'End', new Date(activity.end).format()];
            for (let i = 0; i < 50; i++) {
              props.push('Property ' + (i + 1));
              props.push('Value ' + (i + 1));
            }
            return props;
          },
        },
        {
          selector(object, ctx) {
            return ctx.gantt.colorMode === 'showHouses';
          },
          text(activity) {
            return 'H' + activity.HOUSE;
          },
          background: {
            values(object, ctx) {
              return Object.keys(ctx.gantt.houseTimeWindows);
            },
            // Default palette is used
            getValue: 'HOUSE', // Access the HOUSE field of provided activity. eq to function(act) { return act.HOUSE; }
          },
          color: 'automatic',
        },
        {
          selector(object, ctx) {
            return ctx.gantt.colorMode === 'showAll';
          },
          text(activity) {
            return 'H' + activity.HOUSE + '-' + activity.TASK.NAME;
          },
          background: {
            values(object, row) {
              return Object.keys(row.gantt.houseTimeWindows);
            },
            getValue: 'HOUSE',
          },
          color: 'automatic',
        },
      ],
      interactor: {
        move: {
          startMove(p) {
            console.log('Start move ' + p.activity.getData().TASK.NAME);
          },
          acceptRowChange(p) {
            console.log(
              '   Accept task ' +
                p.activity.getData().TASK.NAME +
                ' to move to ' +
                p.row.data.NAME +
                ' at time ' +
                p.currentTime.format()
            );
            return !!p.row.data.MANAGER_ID;
          },
          acceptMove(p) {
            console.log('   Accept move of ' + p.activity.getData().TASK.NAME + ' at time ' + p.currentTime.format());
            return true;
          },
          abortMove(p) {
            console.log('   Abort move a task');
          },
          applyMove(p) {
            console.log('   Apply move of a task');
          },
          stopMove(p) {
            console.log('Stop move ' + +p.activity.getData().TASK.NAME);
          },
        },
      },
    },
    toolbar: [
      'title',
      'search',
      'separator',
      'mini',
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
      'separator',
      // User specific toolbar components
      {
        type: 'select',
        text: 'Show',
        options: [
          { value: 'showTasks', text: 'Tasks' },
          { value: 'showHouses', text: 'Houses' },
          { value: 'showAll', text: 'All' },
        ],
        onchange(value, ctx) {
          const gantt = ctx.gantt;
          gantt.colorMode = value;
          gantt.draw();
        },
      },
      {
        type: 'select',
        text: 'Filter on house',
        options: [
          { value: 'none', text: 'None' },
          { value: '1', text: 'House 1' },
          { value: '2', text: 'House 2' },
          { value: '3', text: 'House 3' },
          { value: '4', text: 'House 4' },
          { value: '5', text: 'House 5' },
          { value: '6', text: 'House 6' },
          { value: '7', text: 'House 7' },
          { value: '8', text: 'House 8' },
          { value: '9', text: 'House 9' },
          { value: '10', text: 'House 10' },
          { value: '11', text: 'House 11' },
          { value: '12', text: 'House 12' },
          { value: '13', text: 'House 13' },
          { value: '14', text: 'House 14' },
          { value: '15', text: 'House 15' },
          { value: '16', text: 'House 16' },
          { value: '17', text: 'House 17' },
          { value: '18', text: 'House 18' },
          { value: '19', text: 'House 19' },
          { value: '20', text: 'House 20' },
        ],
        onchange(house, ctx) {
          const gantt = ctx.gantt;
          if (gantt.houseFilter) {
            gantt.removeFilter(gantt.houseFilter);
          }
          if (house && house !== 'none') {
            gantt.houseFilter = gantt.addFilter(
              function(obj) {
                return obj.HOUSE && obj.HOUSE === house;
              },
              true /* filter rows */,
              true /* filter activities */
            );
          }
        },
      },
      {
        type: 'select',
        text: 'Time Window',
        options: [
          { value: 'none', text: 'None' },
          { value: '1', text: 'House 1' },
          { value: '2', text: 'House 2' },
          { value: '3', text: 'House 3' },
          { value: '4', text: 'House 4' },
          { value: '5', text: 'House 5' },
          { value: '6', text: 'House 6' },
          { value: '7', text: 'House 7' },
          { value: '8', text: 'House 8' },
          { value: '9', text: 'House 9' },
          { value: '10', text: 'House 10' },
          { value: '11', text: 'House 11' },
          { value: '12', text: 'House 12' },
          { value: '13', text: 'House 13' },
          { value: '14', text: 'House 14' },
          { value: '15', text: 'House 15' },
          { value: '16', text: 'House 16' },
          { value: '17', text: 'House 17' },
          { value: '18', text: 'House 18' },
          { value: '19', text: 'House 19' },
          { value: '20', text: 'House 20' },
        ],
        onchange(house, ctx) {
          const gantt = ctx.gantt;
          if (gantt.timeMarkers) {
            gantt.removeTimeMarker(gantt.timeMarkers.markerStart);
            gantt.removeTimeMarker(gantt.timeMarkers.markerEnd);
            gantt.removeTimeLineItem(gantt.timeMarkers.item);
          }
          if (house && house !== 'none') {
            gantt.timeMarkers = {
              markerStart: 'HouseStart' + house,
              markerEnd: 'HouseEnd' + house,
              item: 'item' + house,
            };
            gantt.addTimeMarker(gantt.timeMarkers.markerStart, gantt.houseTimeWindows[house].start);
            gantt.addTimeMarker(gantt.timeMarkers.markerEnd, gantt.houseTimeWindows[house].end);
            gantt.addTimeLineItem(gantt.timeMarkers.item, {
              start: gantt.houseTimeWindows[house].start,
              end: gantt.houseTimeWindows[house].end,
              className: 'HouseBackground' + house,
              type: 'background',
              title: 'Time window House ' + house,
              content:
                '<div style="border:solid 1px black; background-color:white; color:black; font-size: 12px;">' +
                'Time window House ' +
                house +
                (house === '2' ? ' <br>On top of tasks</br>' : '') +
                '</div>',
            });
          }
          gantt.draw();
        },
      },
    ],
    classes: 'ibm',
    title() {
      return 'House Building';
    },
  };
}
storiesOf('Storybook|Examples', module).add('House Building', () => {
  setTimeout(() => {
    new Gantt('gantt', createHouseBuildingGanttConfig()); // eslint-disable-line no-new
  }, 0);
  return '<div id="gantt"></div>';
});
