import { test, expect } from '@playwright/test';

test.describe('The Sandbox Audit - Pi Payment Flow', () => {
  test('should successfully initiate a sovereign agent hire', async ({ page }) => {
    // 1. Navigate to Marketplace
    await page.goto('/marketplace');
    
    // 2. Verify Page Title
    await expect(page.locator('h1')).toContainText('HIRE SOVEREIGN AGENTS');

    // 3. Click Hire Agent on the first agent
    const hireButton = page.locator('button:has-text("Hire Agent")').first();
    await hireButton.click();

    // 4. Verify processing state or auth modal
    // Note: Since Pi SDK requires a real browser environment and wallet, 
    // we check if the system handles the "Unauthorized" or "Processing" state gracefully.
    const identityText = page.locator('text=Sovereign Identity');
    await expect(identityText).toBeVisible();
    
    // 5. Check if the bridge connection is logged (optional, check console)
    page.on('console', msg => {
      if (msg.text().includes('[Sovereign Engine]')) {
        console.log('✅ Bridge Communication Detected:', msg.text());
      }
    });
  });
});
