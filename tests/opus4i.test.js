const puppeteer = require('puppeteer');

// Configuration
const config = {
  baseUrl: 'https://opus4i.com',
  viewport: {
    width: 1920,
    height: 1080
  },
  timeout: 30000,
  navigationOptions: {
    waitUntil: ['load', 'networkidle0'],
    timeout: 30000
  }
};

// Helper function to handle errors
const handleError = (error, testName) => {
  console.error(`❌ ${testName} failed:`, error.message);
  if (process.env.DEBUG) {
    console.error('Stack trace:', error.stack);
  }
};

async function runTests() {
  let browser;
  let testsFailed = 0;
  const testsTotal = 10;

  try {
    console.log('🚀 Starting test suite for opus4i.com...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: config.viewport
    });

    const page = await browser.newPage();
    
    // Enable console error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Console Error:', msg.text());
      }
    });

    // Test 1: Homepage loading
    console.log('\nTest 1: Testing homepage load...');
    try {
      const homePageResponse = await page.goto(config.baseUrl, config.navigationOptions);
      
      console.log(`Homepage Status: ${homePageResponse.status()}`);
      if (homePageResponse.ok()) {
        console.log('✅ Homepage loaded successfully');
      } else {
        throw new Error(`Homepage failed to load with status ${homePageResponse.status()}`);
      }
    } catch (error) {
      handleError(error, 'Homepage load test');
      testsFailed++;
    }

    // Test 2: Check main navigation elements
    console.log('\nTest 2: Testing navigation elements...');
    try {
      await page.waitForSelector('nav', { timeout: 5000 });
      const navigationElements = await page.evaluate(() => {
        const navItems = document.querySelectorAll('nav a');
        return Array.from(navItems, item => ({
          text: item.textContent.trim(),
          href: item.href
        }));
      });

      if (navigationElements.length === 0) {
        throw new Error('No navigation elements found');
      }

      console.log('Navigation elements found:', navigationElements.length);
      navigationElements.forEach(item => {
        console.log(`- ${item.text}: ${item.href}`);
      });
    } catch (error) {
      handleError(error, 'Navigation test');
      testsFailed++;
    }

    // Test 3: Check meta information
    console.log('\nTest 3: Testing meta information...');
    try {
      const title = await page.title();
      const metaDescription = await page.$eval(
        'meta[name="description"]',
        element => element.content
      ).catch(() => null);

      if (!title) {
        throw new Error('Page title is empty');
      }

      console.log(`Title: ${title}`);
      console.log(`Meta Description: ${metaDescription || 'Not found'}`);
    } catch (error) {
      handleError(error, 'Meta information test');
      testsFailed++;
    }

    // Test 4: Check responsive design
    console.log('\nTest 4: Testing responsive design...');
    try {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForSelector('nav', { timeout: 5000 });
        
        const isMenuVisible = await page.evaluate(() => {
          const menu = document.querySelector('nav');
          if (!menu) return false;
          const style = window.getComputedStyle(menu);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        console.log(`${viewport.name} menu visibility: ${isMenuVisible ? '✅ Visible' : '❌ Hidden'}`);
      }
    } catch (error) {
      handleError(error, 'Responsive design test');
      testsFailed++;
    }

    // Test 5: Performance metrics
    console.log('\nTest 5: Testing performance metrics...');
    try {
      const performanceMetrics = await page.evaluate(() => {
        const timing = performance.timing || performance.getEntriesByType('navigation')[0];
        if (!timing) return null;
        
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
        };
      });

      if (performanceMetrics) {
        console.log(`Page Load Time: ${performanceMetrics.loadTime}ms`);
        console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
      } else {
        throw new Error('Unable to collect performance metrics');
      }
    } catch (error) {
      handleError(error, 'Performance metrics test');
      testsFailed++;
    }

    // Test 6: Contact Form Submission
    console.log('\nTest 6: Testing contact form submission...');
    try {
      await page.goto(config.baseUrl + '/contact', config.navigationOptions);
      console.log('✅ Contact page loaded');

      // Wait for form elements
      await page.waitForSelector('input[name="fullName"]', { timeout: 5000 });
      await page.waitForSelector('input[name="email"]', { timeout: 5000 });
      await page.waitForSelector('textarea[name="message"]', { timeout: 5000 });

      // Fill out the form
      await page.type('input[name="fullName"]', 'Test User');
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('textarea[name="message"]', 'This is an automated test message.');
      console.log('✅ Form filled out');

      // Submit form and handle both navigation and non-navigation cases
      const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      
      try {
        await Promise.race([
          page.waitForNavigation({ timeout: 10000 }),
          submitButton.click()
        ]);
      } catch (submitError) {
        // Handle case where form submission doesn't trigger navigation
        console.log('Form submitted without page navigation');
      }

      // Check for success message or validation errors
      const successMessage = await page.$eval('h2, .success-message, .alert-success', 
        el => el.textContent
      ).catch(() => null);

      if (successMessage && successMessage.toLowerCase().includes('thank')) {
        console.log('✅ Form submitted successfully');
        console.log('Success message:', successMessage);
      } else {
        // Check for validation errors
        const errors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('.error, .invalid-feedback, [aria-invalid="true"]');
          return Array.from(errorElements, el => el.textContent.trim());
        });
        
        if (errors.length > 0) {
          console.log('❌ Form validation errors:', errors);
        } else {
          console.log('⚠️ Form submission status unclear - no success message or errors found');
        }
      }
    } catch (error) {
      handleError(error, 'Contact form test');
      testsFailed++;
    }

    // Test 7: Footer Links
    console.log('\nTest 7: Testing footer links...');
    try {
      await page.goto(config.baseUrl, config.navigationOptions);
      
      await page.waitForSelector('footer', { timeout: 5000 });
      const footerLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('footer a');
        return Array.from(links, link => ({
          text: link.textContent.trim(),
          href: link.href,
          isVisible: window.getComputedStyle(link).display !== 'none'
        }));
      });

      if (footerLinks.length === 0) {
        throw new Error('No footer links found');
      }

      console.log('Footer links found:', footerLinks.length);
      footerLinks.forEach(link => {
        console.log(`- ${link.text}: ${link.href} (Visible: ${link.isVisible ? '✅' : '❌'})`);
      });
    } catch (error) {
      handleError(error, 'Footer links test');
      testsFailed++;
    }

    // Test 8: Image Loading
    console.log('\nTest 8: Testing images...');
    try {
      await page.waitForSelector('img', { timeout: 5000 });
      const imageStats = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images, img => ({
          src: img.src,
          alt: img.alt,
          hasAlt: img.hasAttribute('alt'),
          isLoaded: img.complete && img.naturalHeight !== 0,
          dimensions: {
            width: img.width,
            height: img.height
          }
        }));
      });

      if (imageStats.length === 0) {
        throw new Error('No images found on the page');
      }

      console.log('Images found:', imageStats.length);
      imageStats.forEach(img => {
        console.log(`- ${img.src}`);
        console.log(`  Alt text: ${img.hasAlt ? img.alt : '❌ Missing'}`);
        console.log(`  Loaded: ${img.isLoaded ? '✅' : '❌'}`);
        console.log(`  Dimensions: ${img.dimensions.width}x${img.dimensions.height}`);
      });
    } catch (error) {
      handleError(error, 'Image loading test');
      testsFailed++;
    }

    // Test 9: Mobile Menu
    console.log('\nTest 9: Testing mobile menu...');
    try {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle0' });
      
      const mobileMenuButton = await page.$(
        '[aria-label*="menu"], .hamburger, .menu-toggle, button[aria-expanded]'
      );

      if (!mobileMenuButton) {
        throw new Error('Mobile menu button not found');
      }

      console.log('✅ Mobile menu button found');
      await mobileMenuButton.click();
      
      // Wait for animation
      await page.waitForTimeout(500);
      
      const menuVisibility = await page.evaluate(() => {
        const menu = document.querySelector('nav, .mobile-menu, .menu-items');
        if (!menu) return 'Menu element not found';
        const style = window.getComputedStyle(menu);
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          transform: style.transform
        };
      });

      console.log('Menu visibility state:', menuVisibility);
    } catch (error) {
      handleError(error, 'Mobile menu test');
      testsFailed++;
    }

    // Test 10: Course Enrollment Verification
    console.log('\nTest 10: Testing course enrollment verification...');
    try {
      // Navigate to the courses page
      await page.goto(config.baseUrl + '/courses', config.navigationOptions);
      console.log('✅ Courses page loaded');

      // Find and click the first available course
      const firstCourse = await page.waitForSelector('.course-card, [data-testid="course-item"]', { timeout: 5000 });
      if (!firstCourse) {
        throw new Error('No courses found on the page');
      }

      await firstCourse.click();
      console.log('✅ Selected first available course');

      // Wait for enrollment button and click it
      const enrollButton = await page.waitForSelector('button[contains(text(), "Enroll")] , .enroll-button', { timeout: 5000 });
      await enrollButton.click();
      console.log('✅ Clicked enroll button');

      // Check for successful enrollment message
      const enrollmentSuccess = await page.waitForSelector('.success-message, .alert-success', { timeout: 5000 })
        .then(el => el.evaluate(node => node.textContent))
        .catch(() => null);

      if (!enrollmentSuccess) {
        throw new Error('Enrollment success message not found');
      }
      console.log('✅ First enrollment successful');

      // Try to enroll in the same course again
      await enrollButton.click();
      
      // Check for duplicate enrollment error message
      const duplicateError = await page.waitForSelector('.error-message, .alert-error, [role="alert"]', { timeout: 5000 })
        .then(el => el.evaluate(node => node.textContent))
        .catch(() => null);

      if (!duplicateError || !duplicateError.toLowerCase().includes('already enrolled')) {
        throw new Error('Duplicate enrollment was not prevented');
      }
      console.log('✅ Duplicate enrollment prevented successfully');

    } catch (error) {
      handleError(error, 'Course enrollment verification test');
      testsFailed++;
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    const testsSuccessful = testsTotal - testsFailed;
    console.log(`\n📊 Test Results: ${testsSuccessful}/${testsTotal} tests passed`);
    
    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}