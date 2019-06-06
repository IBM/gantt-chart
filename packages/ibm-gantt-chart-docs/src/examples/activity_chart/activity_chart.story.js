import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import createXMLDataConfig from './createXMLDataConfig';

import '../stories.scss';

function createActivitiesGanttConfig() {
  const ganttData = createXMLDataConfig('activity_chart/activity_chart.xml');
  return {
    data: ganttData,
    classes: 'activity-chart-example',
    type: Gantt.type.ACTIVITY_CHART,
    constraints: {
      renderer: [
        {
          selector(object, ctx) {
            return ctx.gantt.layoutLabelMode === 'right';
          },
          nodeLabelLayout: 'right',
        },
        {
          selector(object, ctx) {
            return ctx.gantt.layoutLabelMode === 'left';
          },
          nodeLabelLayout: 'left',
        },
        {
          selector(object, ctx) {
            return ctx.gantt.layoutLabelMode === 'noLinkCrossing';
          },
          nodeLabelLayout: {
            padding: 12, // Horizontal padding between the label and the node or link
            // If possible place the node label in a free space between a node/link and a link.
            //      If several holes are possible, choose the one the closest from the node.
            // If not possible, place the text after the last link from the node
            startLayout(act, labelWidth, ctx) {
              this.closestHole = null;
              this.furtherLeft = this.padding;
              this.furtherRight = this.padding;
              this.w = labelWidth + this.padding;
            },
            nextLink(act, left, linkX, previousX, nodeX, ctx) {
              if (Math.abs(linkX - previousX) >= this.w) {
                const newHole = left
                  ? -Math.abs(nodeX - previousX) - this.padding
                  : Math.abs(previousX - nodeX) + this.padding;
                if (this.closestHole === null || Math.abs(newHole) < Math.abs(this.closestHole)) {
                  this.closestHole = newHole + (left ? -this.padding : this.padding);
                }
              }
              // Keep track of the position of the furthest link from the node on this side
              else if (left) {
                this.furtherLeft = Math.max(Math.abs(nodeX - linkX) + this.padding, this.furtherLeft);
              } else {
                this.furtherRight = Math.max(Math.abs(linkX - nodeX) + this.padding, this.furtherRight);
              }
            },
            getNodeToLabelSpacing(act, bbox, textWidth, ctx) {
              return this.closestHole !== null
                ? this.closestHole
                : this.furtherLeft < this.furtherRight
                ? -this.furtherLeft
                : this.furtherRight;
            },
          },
        },
      ],
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
      // User specific label layout
      {
        type: 'select',
        text: 'Show',
        options: [
          { value: 'default', text: 'Default' },
          { value: 'right', text: 'Right' },
          { value: 'left', text: 'Left' },
          { value: 'noLinkCrossing', text: 'No link crossing' },
        ],
        onchange(value, ctx) {
          const { gantt } = ctx;
          gantt.layoutLabelMode = value;
          gantt.draw(true);
        },
      },
    ],
    title: 'Activity Chart example',
  };
}

storiesOf('Storybook|Examples', module).add('Activity Chart', () => {
  setTimeout(() => {
    new Gantt('gantt', createActivitiesGanttConfig()); // eslint-disable-line no-new
  }, 0);
  return '<div id="gantt"></div>';
});
