import { chromium } from 'playwright'

const BASE = process.argv[2] || 'https://gonorth.vercel.app'

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`)
})

async function checkRoute(path) {
  errors.length = 0
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  const mainText = (await page.locator('main').innerText().catch(() => '')).trim()
  const url = page.url()
  console.log(`\n${path}: url=${url}`)
  console.log(`  main chars=${mainText.length} preview=${JSON.stringify(mainText.slice(0, 120))}`)
  if (mainText.length < 5) console.log('  *** LIKELY BLANK ***')
  if (errors.length) console.log(`  errors: ${errors.join(' | ')}`)
  return mainText.length
}

for (const path of ['/', '/plan', '/trip', '/pools', '/forum', '/vendor/login']) {
  await checkRoute(path)
}

await browser.close()
