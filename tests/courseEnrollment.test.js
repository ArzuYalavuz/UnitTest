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

describe('Course Enrollment Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: config.viewport
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should prevent duplicate course enrollment', async () => {
    try {
      // Navigate to the courses page
      await page.goto(`${config.baseUrl}/courses`, config.navigationOptions);
      
      // Find and click the first available course
      const firstCourse = await page.waitForSelector('.course-card, [data-testid="course-item"]', {
        timeout: config.timeout
      });
      expect(firstCourse).toBeTruthy();
      
      await firstCourse.click();
      
      // Get course title for verification
      const courseTitle = await page.$eval('h1, .course-title', el => el.textContent);
      
      // Find and click the enrollment button
      const enrollButton = await page.waitForSelector(
        'button:has-text("Enroll"), .enroll-button',
        { timeout: config.timeout }
      );
      expect(enrollButton).toBeTruthy();
      
      // First enrollment attempt
      await enrollButton.click();
      
      // Wait for success message
      const successMessage = await page.waitForSelector(
        '.success-message, .alert-success',
        { timeout: config.timeout }
      );
      expect(successMessage).toBeTruthy();
      
      const successText = await successMessage.evaluate(el => el.textContent);
      expect(successText.toLowerCase()).toContain('success');
      
      // Second enrollment attempt
      await enrollButton.click();
      
      // Wait for error message
      const errorMessage = await page.waitForSelector(
        '.error-message, .alert-error, [role="alert"]',
        { timeout: config.timeout }
      );
      expect(errorMessage).toBeTruthy();
      
      const errorText = await errorMessage.evaluate(el => el.textContent);
      expect(errorText.toLowerCase()).toContain('already enrolled');
      
      // Verify enrollment status
      const enrollmentStatus = await page.$eval(
        '.enrollment-status, .course-status',
        el => el.textContent
      );
      expect(enrollmentStatus.toLowerCase()).toContain('enrolled');
      
    } catch (error) {
      throw new Error(`Course enrollment test failed: ${error.message}`);
    }
  });

  test('should show enrolled status in course listing', async () => {
    try {
      // Navigate back to courses page
      await page.goto(`${config.baseUrl}/courses`, config.navigationOptions);
      
      // Find enrolled course and verify its status
      const enrolledCourse = await page.waitForSelector('.course-card.enrolled, [data-testid="course-item"][data-enrolled="true"]', {
        timeout: config.timeout
      });
      expect(enrolledCourse).toBeTruthy();
      
      const statusIndicator = await enrolledCourse.$('.enrollment-status, .status-badge');
      const status = await statusIndicator.evaluate(el => el.textContent);
      expect(status.toLowerCase()).toContain('enrolled');
      
    } catch (error) {
      throw new Error(`Course listing enrollment status test failed: ${error.message}`);
    }
  });
}); 