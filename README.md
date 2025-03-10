# OPUS4i Test Suite

This is an automated test suite for the OPUS4i website using Puppeteer.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Running Tests

To run the tests:
```bash
node tests/opus4i.test.js
```

To run with debug information:
```bash
DEBUG=true node tests/opus4i.test.js
```

## Test Coverage

The test suite covers:
1. Homepage loading
2. Navigation elements
3. Meta information
4. Responsive design
5. Performance metrics
6. Contact form submission
7. Footer links
8. Image loading
9. Mobile menu functionality

## Error Handling

- Each test is run independently
- Detailed error messages are provided
- Test results summary is shown at the end
- Exit code 1 if any test fails, 0 if all pass
