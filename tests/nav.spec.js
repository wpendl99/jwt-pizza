import { test, expect } from "playwright-test-coverage";

test("about page is accessible", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByRole("link", { name: "About" }).click();
    await expect(
        page.getByRole("link", { name: "about", exact: true })
    ).toBeVisible();
    await page.getByText("The secret sauce").click();
});

test("docs are accessible", async ({ page }) => {
    await page.goto("http://localhost:5173/docs/");
    await expect(page.getByRole("link", { name: "docs" })).toBeVisible();
    await page.goto("http://localhost:5173/docs/factory");
    await expect(
        page.getByRole("link", { name: "factory", exact: true })
    ).toBeVisible();
});
