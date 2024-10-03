import { test, expect } from "playwright-test-coverage";

test("home page", async ({ page }) => {
    await page.goto("/");

    expect(await page.title()).toBe("JWT Pizza");
});

test("login", async ({ page }) => {
    await page.route("*/**/api/auth", async (route) => {
        const loginReq = { email: "dummy@jwt.com", password: "dummy" };
        const loginRes = {
            user: {
                id: 191,
                name: "dummy dummy",
                email: "dummy@jwt.com",
                roles: [{ role: "diner" }],
            },
            token: "abcdef",
        };
        expect(route.request().method()).toBe("PUT");
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByPlaceholder("Email address").click();
    await page.getByPlaceholder("Email address").fill("dummy@jwt.com");
    await page.getByPlaceholder("Password").fill("dummy");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(
        page.getByRole("link", { name: "dd", exact: true })
    ).toBeVisible();
    await page.getByRole("link", { name: "dd", exact: true }).click();
    await expect(page.getByText("dummy@jwt.com")).toBeVisible();
    await expect(page.getByText("diner", { exact: true })).toBeVisible();
    await expect(page.getByText("dummy dummy")).toBeVisible();
});
