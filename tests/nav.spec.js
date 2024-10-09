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
    await page.route("**/api/docs", (route) => {
        route.fulfill({
            status: 200,
            body: JSON.stringify({
                version: "20240518.154317",
                endpoints: [
                    {
                        method: "POST",
                        path: "/api/auth",
                        description: "Register a new user",
                        example:
                            'curl -X POST localhost:3000/api/auth -d \'{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}\' -H \'Content-Type: application/json\'',
                        response: {
                            user: {
                                id: 2,
                                name: "pizza diner",
                                email: "d@jwt.com",
                                roles: [
                                    {
                                        role: "diner",
                                    },
                                ],
                            },
                            token: "tttttt",
                        },
                    },
                    {
                        method: "PUT",
                        path: "/api/auth/:userId",
                        requiresAuth: true,
                        description: "Update user",
                        example:
                            'curl -X PUT localhost:3000/api/auth/1 -d \'{"email":"a@jwt.com", "password":"admin"}\' -H \'Content-Type: application/json\' -H \'Authorization: Bearer tttttt\'',
                        response: {
                            id: 1,
                            name: "常用名字",
                            email: "a@jwt.com",
                            roles: [
                                {
                                    role: "admin",
                                },
                            ],
                        },
                    },
                ],
                config: {
                    factory: "https://pizza-factory.cs329.click",
                    db: "localhost",
                },
            }),
        });
    });
    await page.goto("http://localhost:5173/docs/");
    await expect(page.getByRole("link", { name: "docs" })).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "[POST] /api/auth" })
    ).toBeVisible();
    await page.goto("http://localhost:5173/docs/factory");
    await expect(
        page.getByRole("link", { name: "factory", exact: true })
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "[POST] /api/auth" })
    ).toBeVisible();
});

test("history is accessible", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByRole("link", { name: "History" }).click();
    await expect(
        page.getByRole("link", { name: "history", exact: true })
    ).toBeVisible();
    await page.getByText("Mama Rucci, my my").click();
});

test("navigate to menu from home", async ({ page }) => {
    await page.goto("http://localhost:5173/");
    await page.getByRole("button", { name: "Order now" }).click();
    await expect(
        page.getByRole("link", { name: "menu", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Awesome is a click away")).toBeVisible();
});
