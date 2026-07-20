// Shared nurse-scheduling fixture used by the SvelteKit demo route and Storybook stories.
import type { GanttConfig, Resource } from 'ibm-gantt-chart'

export const nursesData: Resource[] = [
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
]

export const nursesConfig: GanttConfig = {
  data: {
    resources: {
      data: nursesData,
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
  toolbar: [
    'title',
    'search',
    'separator',
    {
      type: 'button',
      text: 'Refresh',
      fontIcon: 'fa fa-refresh fa-lg',
      onclick(ctx: { gantt: { draw: () => void } }) {
        ctx.gantt.draw()
      },
    },
    'fitToContent',
    'zoomIn',
    'zoomOut',
  ],
  title: 'Simple Gantt',
}
