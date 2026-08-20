const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navigating to index.html...");
  await page.goto('file:///' + __dirname.replace(/\\/g, '/').replace('/scratch', '') + '/index.html');
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Done testing index.html");
  await browser.close();
})();
