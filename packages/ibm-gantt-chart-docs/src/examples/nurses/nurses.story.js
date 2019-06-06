import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import '../stories.scss';
import './nurses.css';

function createNurseGanttConfig(ctx) {
  function processModels(nurses, settings) {
    const gantt = settings.gantt;
    const ganttModels = {};
    gantt.ganttModels = ganttModels;
    const modelTpl = {
      resources: {
        data: null,
        parent: 'parent',
        activities: 'activities',
        name: 'name',
        id: 'id',
      },
      activities: {
        start: 'start',
        end: 'end',
        name: 'name',
      },
    };
    ganttModels.nurses = Gantt.utils.mergeObjects(true, {}, modelTpl);
    ganttModels.nurses.resources.data = nurses.concat();
    // Create model ordered by skills
    const nursesBySkills = {},
      skillRows = [];
    function addNurseSkillRow(skill) {
      if (!nursesBySkills[skill]) {
        skillRows.push({
          id: skill,
          name: skill,
        });
        nursesBySkills[skill] = true;
      }
      const nurseRow = Gantt.utils.mergeObjects({}, nurse); // Make a copy of the nurse object
      nurseRow.parent = skill;
      nurseRow.id = `${skill}-${nurse.id}`;
      skillRows.push(nurseRow);
    }
    for (var iNurse = 0, count = nurses.length, nurse; iNurse < count; ++iNurse) {
      nurse = nurses[iNurse];
      if (nurse.skills && nurse.skills.length) {
        nurse.skills.map(addNurseSkillRow);
      } else {
        addNurseSkillRow('none');
      }
    }
    ganttModels.skills = Gantt.utils.mergeObjects({}, modelTpl);
    ganttModels.skills.resources.data = skillRows;
    return nurses;
  }

  const base = (ctx && ctx.base) || '';
  function resourcePath(relativePath) {
    return base + relativePath;
  }

  return {
    data: {
      resources: {
        url: 'nurses/nurses.json',
        success: processModels,
        parent: 'parent',
        activities: 'activities',
        name: 'name',
        id: 'id',
      },
      activities: {
        start: 'start',
        end: 'end',
        name: 'name',
      },
    },
    classes: 'nurses',
    table: {
      columns: [
        {
          name: 'rowNumbers',
          remove: true,
        },
        {
          name: 'hierarchy',
          renderer: {
            text(nurse) {
              return nurse.name;
            },
            iconPaths: {
              Anaesthesiology: resourcePath('nurses/images/anesth.png'),
              Geriatrics: resourcePath('nurses/images/geriatrcs.png'),
              Oncology: resourcePath('nurses/images/onco.png'),
              Pediatrics: resourcePath('nurses/images/pediatrics.png'),
            },
            icon(nurse) {
              const icons = [];
              if (!nurse.skills) {
                // Maybe a skill name
                if (this.iconPaths[nurse.name]) {
                  icons.push(this.iconPaths[nurse.name]);
                } else if (nurse.name === 'Cardiac Care') {
                  icons.push(resourcePath('nurses/images/cardio.png'));
                }
              } else {
                for (let i = 0, count = nurse.skills.length; i < count; ++i) {
                  icons.push(this.iconPaths[nurse.skills[i]] || resourcePath('nurses/images/cardio.png'));
                }
              }
              return icons;
            },
          },
        },
        {
          title: 'Skills',
          renderer: {
            text(nurse) {
              return (nurse.skills && nurse.skills.join(', ')) || '';
            },
            background: {
              getValue(nurse) {
                return nurse.skills && nurse.skills.length ? nurse.skills[0] : null;
              },
              // If commenting the line below and therefore not providing possible values returned by getValue,
              // possible values are automatically processed along with calls to getValue and the first value
              // returned by getValue is associated with the first palette color. The second distinct value
              // returned by getValue is associated with the second palette color and so on.
              // Specifying the values ensures a skill will be always associated with the same palette color.
              values: [null, 'Anaesthesiology', 'Pediatrics', 'Oncology', 'Cardiac Care', 'Geriatrics'],
              palette: ['#f7f5f5', '#00b29e', '#5aa8f8', '#4178bc', '#8cd211', '#c8f08f'],
            },
            color: 'automatic',
          },

          sortComparator(a, b) {
            // Compare function is called only for nodes with the same parent node
            // If a is a folder, b is a folder
            // If a is a nurse, b is a nurse.
            if (!a.skills) {
              // Comparison of Skills folders.
              // Returning 0 leaves folders unsorted
              return 0;
              // To sort folder alphabatically, comment previous line and uncomment following one.
              // return a.name < b.name? -1 : a.name > b.name? 1 : 0;
            }

            // We compare nurses
            return a.skills.length < b.skills.length ? -1 : a.skills.length > b.skills.length ? 1 : 0;
          },
          // If just displaying text without color rendering, comment the renderer node above and uncomment
          // the code below
          /* text : function(nurse) {
                     return nurse.skills && nurse.skills.join(', ') || '';
                     } */
        },
      ],
    },
    timeTable: {
      renderer: {
        generateDecorations(start, end, ctx) {
          const gantt = ctx.gantt;
          const horiz = gantt.timeLine.getHorizon(); // Get data horizon
          return [
            /* Uncomment those two lines and comment the two following ones to see how to specify a own style defined in nurses.css instead of using a predefined one
                         { start: start, end : horiz.start, className : 'unscheduled-area' },
                         { start: horiz.end, end : end, className : 'unscheduled-area' } */
            { start, end: horiz.start, type: 'invalid' },
            { start: horiz.end, end, type: 'invalid' },
          ];
        },
        generateRowDecorations(nurse, start, end) {
          const dayoffs = nurse.dayoffs;
          const breaks = [];
          if (dayoffs && dayoffs.length) {
            let date = new Date(start),
              startDate,
              nextDay;
            while (date.getTime() < end) {
              nextDay = new Date(date.valueOf());
              nextDay.setDate(date.getDate() + 1);
              nextDay.setHours(0, 0, 0, 0);
              if (dayoffs.indexOf(date.getDay()) > -1) {
                startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                breaks.push({
                  start: startDate.getTime(),
                  end: nextDay.getTime(),
                });
              }
              date = nextDay;
            }
          }
          return breaks;
        },
      },
    },
    toolbar: [
      'title',
      'search',
      'separator',
      'mini',
      'separator',
      'fitToContent',
      'zoomIn',
      'zoomOut',
      'separator',
      // User specific toolbar components
      {
        type: 'select',
        text: 'Display type',
        options: [{ value: 'nurses', text: 'Nurses' }, { value: 'skills', text: 'Skills' }],
        onchange(value, ctx) {
          const gantt = ctx.gantt;
          gantt.load(gantt.ganttModels[value]);
        },
      },
    ],
    title: 'Nurse example',
  };
}

storiesOf('Storybook|Examples', module).add('Nurses', () => {
  setTimeout(() => {
    new Gantt('gantt', createNurseGanttConfig()); // eslint-disable-line no-new
  }, 0);
  return '<div id="gantt"></div>';
});
