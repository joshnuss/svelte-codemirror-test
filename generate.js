const { chromium } = require('playwright')

const run = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width: 1920, height: 1080
    },
    recordVideo: {
      dir: '.',
      size: { width: 1920, height: 1080 }
    }
  })
  const page = await context.newPage()

  await page.goto('http://localhost:8080')
  await page.click('button.play')

  setTimeout(async () => {
    await browser.close()
  }, 5000)
}

run()
