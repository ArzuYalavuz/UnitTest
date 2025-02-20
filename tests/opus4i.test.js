describe('OPUS4i Website Tests', () => {
  beforeAll(async () => {
    await page.setViewport({ width: 1920, height: 1080 });
  });

  beforeEach(async () => {
    await page.goto('https://opus4i.com');
  });

  test('Homepage loads successfully', async () => {
    await expect(page.title()).resolves.toMatch('OPUS4i');
    const content = await page.content();
    expect(content).toContain('OPUS4i');
  });

  test('Navigation menu is present', async () => {
    const navigationMenu = await page.$('nav');
    expect(navigationMenu).toBeTruthy();
  });

  test('Contact form is accessible', async () => {
    // Navigate to contact page or scroll to contact form
    const contactForm = await page.$('form');
    expect(contactForm).toBeTruthy();
  });

  test('Footer contains copyright information', async () => {
    const footer = await page.$('footer');
    const footerText = await page.evaluate(footer => footer.textContent, footer);
    expect(footerText).toContain('OPUS4i');
  });

  test('Images load properly', async () => {
    const images = await page.$$('img');
    for (const image of images) {
      const naturalWidth = await page.evaluate(img => img.naturalWidth, image);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('Links are valid', async () => {
    const links = await page.$$('a');
    for (const link of links) {
      const href = await page.evaluate(a => a.href, link);
      expect(href).toBeTruthy();
    }
  });

  // Add more specific tests based on website functionality
  test('Performance metrics', async () => {
    const metrics = await page.metrics();
    expect(metrics.TaskDuration).toBeLessThan(10000); // 10 seconds threshold
  });
}); 