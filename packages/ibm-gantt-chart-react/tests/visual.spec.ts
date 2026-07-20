import { test, expect } from '@playwright/test'

test.describe('GanttChart visual regression', () => {
  test('default chart renders consistently', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.ibm-gantt-chart-react', { state: 'visible', timeout: 10000 })
    // Allow the gantt chart (and vis-timeline axis) to settle
    await page.waitForTimeout(2000)

    const chart = page.locator('.ibm-gantt-chart-react')
    await expect(chart).toHaveScreenshot('gantt-chart-default.png')
  })
})
