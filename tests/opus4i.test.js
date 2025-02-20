const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    console.log('Starting tests for opus4i.com...');

    // Test 1: Homepage loading
    console.log('\nTest 1: Testing homepage load...');
    const homePageResponse = await page.goto('https://opus4i.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log(`Homepage Status: ${homePageResponse.status()}`);
    if (homePageResponse.ok()) {
      console.log('✅ Homepage loaded successfully');
    } else {
      console.error('❌ Homepage failed to load');
    }

    // Test 2: Check main navigation elements
    console.log('\nTest 2: Testing navigation elements...');
    const navigationElements = await page.evaluate(() => {
      const navItems = document.querySelectorAll('nav a');
      return Array.from(navItems, item => ({
        text: item.textContent.trim(),
        href: item.href
      }));
    });

    console.log('Navigation elements found:', navigationElements.length);
    navigationElements.forEach(item => {
      console.log(`- ${item.text}: ${item.href}`);
    });

    // Test 3: Check page title and meta description
    console.log('\nTest 3: Testing meta information...');
    const title = await page.title();
    const metaDescription = await page.$eval(
      'meta[name="description"]',
      element => element.content
    ).catch(() => null);

    console.log(`Title: ${title}`);
    console.log(`Meta Description: ${metaDescription || 'Not found'}`);

    // Test 4: Check responsive design
    console.log('\nTest 4: Testing responsive design...');
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.reload({ waitUntil: 'networkidle0' });
      const isMenuVisible = await page.evaluate(() => {
        const menu = document.querySelector('nav');
        const style = window.getComputedStyle(menu);
        return style.display !== 'none';
      });
      console.log(`${viewport.name} menu visibility: ${isMenuVisible ? '✅ Visible' : '❌ Hidden'}`);
    }

    // Test 5: Performance metrics
    console.log('\nTest 5: Testing performance metrics...');
    const performanceMetrics = await page.evaluate(() => {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      return {
        loadTime,
        domContentLoaded
      };
    });

    console.log(`Page Load Time: ${performanceMetrics.loadTime}ms`);
    console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);

    // Test 6: Check for console errors
    console.log('\nTest 6: Checking for console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
      }
    });

    await page.reload({ waitUntil: 'networkidle0' });
    console.log('Console error check completed');

    // Test 7: Contact Form Submission
    console.log('\nTest 7: Testing contact form submission...');
    try {
      // Navigate to contact page
      await page.goto('https://opus4i.com/contact', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      console.log('✅ Contact page loaded');

      // Fill out the form
      await page.type('input[name="fullName"]', 'Test User');
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('textarea[name="message"]', 'This is an automated test message.');
      console.log('✅ Form filled out');

      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);

      // Verify success message
      const successMessage = await page.$eval('h2', el => el.textContent);
      if (successMessage.includes('Thanks')) {
        console.log('✅ Form submitted successfully');
        console.log('Success message:', successMessage);
      } else {
        console.error('❌ Form submission verification failed');
      }
    } catch (error) {
      console.error('Contact form test failed:', error);
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    console.log('\nTest suite completed');
  }
}

// Run the tests
runTests();