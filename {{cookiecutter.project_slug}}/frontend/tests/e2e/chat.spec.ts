import { test, expect } from "@playwright/test";

/**
 * E2E tests for the chat/copilot functionality.
 */

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copilot");
  });

  test("should display chat interface", async ({ page }) => {
    // Check for main chat components
    await expect(page.locator("text=Conversations")).toBeVisible();
    await expect(page.getByRole("button", { name: /new chat/i })).toBeVisible();
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
  });

  test("should create a new thread", async ({ page }) => {
    // Click new chat button
    await page.getByRole("button", { name: /new chat/i }).click();

    // Should see empty chat
    await expect(page.getByText(/how can i help/i)).toBeVisible();
  });

  test("should send a message and receive response", async ({ page }) => {
    // Type a message
    const input = page.getByPlaceholder(/type a message/i);
    await input.fill("Hello, how are you?");

    // Send the message
    await page.getByRole("button", { name: /send/i }).click();

    // Wait for user message to appear
    await expect(page.getByText("Hello, how are you?")).toBeVisible();

    // Wait for assistant response (with timeout for API call)
    await expect(page.locator('[data-role="assistant"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test("should show typing indicator during response", async ({ page }) => {
    const input = page.getByPlaceholder(/type a message/i);
    await input.fill("Tell me a short joke");
    await page.getByRole("button", { name: /send/i }).click();

    // Should show loading state
    await expect(page.locator(".animate-bounce")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should toggle sidebar visibility", async ({ page }) => {
    // Sidebar should be visible initially
    await expect(page.getByText("Conversations")).toBeVisible();

    // Find and click the close sidebar button
    const closeButton = page.locator('button:has(svg.lucide-panel-left-close)');
    if (await closeButton.isVisible()) {
      await closeButton.click();

      // Sidebar should be hidden
      await expect(page.getByText("Conversations")).not.toBeVisible();

      // Open sidebar button should appear
      const openButton = page.locator('button:has(svg.lucide-panel-left-open)');
      await expect(openButton).toBeVisible();
    }
  });
});
