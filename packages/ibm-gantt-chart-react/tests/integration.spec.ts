import { test, expect } from '@playwright/test'

test.describe('GanttChart integration', () => {
  test('mounts without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForSelector('.ibm-gantt-chart-react', { state: 'visible', timeout: 10000 })

    expect(errors).toHaveLength(0)
  })

  test('has expected title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/IBM Gantt Chart React/)
  })

  test('mounts the gantt panel into the container', async ({ page }) => {
    await page.goto('/')
    // .gantt-panel is the root element the core library appends on construction
    await expect(page.locator('.ibm-gantt-chart-react .gantt-panel')).toBeVisible({ timeout: 10000 })
  })
})
