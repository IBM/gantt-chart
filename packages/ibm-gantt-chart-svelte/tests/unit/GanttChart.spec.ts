import { test, expect, describe, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import GanttChart from '../../src/lib/GanttChart.svelte'
import type { GanttConfig } from 'ibm-gantt-chart'

// The real ibm-gantt-chart is a vanilla JS browser library that requires
// layout APIs jsdom does not provide. Mock it with a minimal stand-in that
// mimics the constructor/destroy contract used by the wrapper.
vi.mock('ibm-gantt-chart', () => {
  class MockGantt {
    node: HTMLElement
    config: unknown

    constructor(node: HTMLElement, config: unknown) {
      this.node = node
      this.config = config
      const el = document.createElement('div')
      el.className = 'gantt-panel'
      node.appendChild(el)
    }

    destroy() {
      while (this.node.firstChild) {
        this.node.removeChild(this.node.firstChild)
      }
    }
  }
  return { default: MockGantt }
})

const validConfig: GanttConfig = {
  data: {
    resources: {
      data: [
        {
          id: '1',
          name: 'Alice',
          activities: [{ id: 'a1', name: 'Task A', start: 0, end: 1000 }],
        },
      ],
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
  title: 'Test Gantt',
}

describe('GanttChart', () => {
  test('renders container div', () => {
    render(GanttChart, { props: { config: validConfig } })
    expect(document.querySelector('.ibm-gantt-chart-svelte')).toBeTruthy()
  })

  test('applies custom class', () => {
    render(GanttChart, { props: { config: validConfig, class: 'my-custom-class' } })
    const el = document.querySelector('.ibm-gantt-chart-svelte.my-custom-class')
    expect(el).toBeTruthy()
  })

  test('mounts the Gantt instance into the container', async () => {
    render(GanttChart, { props: { config: validConfig } })
    await vi.waitFor(() => expect(document.querySelector('.gantt-panel')).toBeTruthy())
  })

  test('calls onload when initialized', async () => {
    const onload = vi.fn()
    render(GanttChart, { props: { config: validConfig, onload } })
    await vi.waitFor(() => expect(onload).toHaveBeenCalled(), { timeout: 2000 })
  })
})
