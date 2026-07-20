import React from 'react'
import { test, expect, describe, vi } from 'vitest'
import { render } from '@testing-library/react'
import GanttChart from '../../src/components/GanttChart/GanttChart'

vi.mock('ibm-gantt-chart', () => {
  class MockGantt {
    constructor(node, config) {
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

const validConfig = {
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
    render(<GanttChart config={validConfig} />)
    expect(document.querySelector('.ibm-gantt-chart-react')).toBeTruthy()
  })

  test('applies custom class', () => {
    render(<GanttChart config={validConfig} className="my-custom-class" />)
    const el = document.querySelector('.ibm-gantt-chart-react.my-custom-class')
    expect(el).toBeTruthy()
  })

  test('mounts the Gantt instance into the container', async () => {
    render(<GanttChart config={validConfig} />)
    await vi.waitFor(() => expect(document.querySelector('.gantt-panel')).toBeTruthy())
  })

  test('calls onload when initialized', async () => {
    const onLoad = vi.fn()
    render(<GanttChart config={validConfig} onLoad={onLoad} />)
    await vi.waitFor(() => expect(onLoad).toHaveBeenCalled(), { timeout: 2000 })
  })
})
