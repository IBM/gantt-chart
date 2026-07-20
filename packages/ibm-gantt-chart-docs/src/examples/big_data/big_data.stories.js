import Gantt from 'ibm-gantt-chart';

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

export default {
  title: 'Storybook/Performances',
};

export const BigData = {
  render: () => {
    setTimeout(() => {
      const startTime = new Date().getTime();
      console.log('Start');
      const gantt = new Gantt('gantt', createAirbusConfig());
      gantt.on(Gantt.events.TIME_LINE_INIT, () =>
        console.log(`Initialization time: ${new Date().getTime() - startTime} millis`)
      );
    }, 0);
    return '<div id="gantt"></div>';
  },
};
