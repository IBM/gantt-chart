import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import '../stories.scss';

function createAirbusConfig() {
  return {
    data: {
      resources: {
        url: 'airbus/airbus.json',
        parent: 'ParentID',
        id: 'id',
        activities: 'tasks',
        name: 'name',
      },
      activities: {
        start: 'from',
        end: 'to',
        name: 'name',
        id: 'id',
      },
    },
    classes: 'airbus',
    title() {
      return 'Airbus';
    },
  };
}

storiesOf('Storybook|Performances', module).add('Big Data', () => {
  setTimeout(() => {
    var startTime = new Date().getTime();
    console.log('Start');
    var gantt = new Gantt('gantt', createAirbusConfig());
    gantt.on(Gantt.events.TIME_LINE_INIT, () =>
      console.log(`Initialization time: ${new Date().getTime() - startTime} millis`)
    );
  }, 0);
  return '<div id="gantt"></div>';
});
