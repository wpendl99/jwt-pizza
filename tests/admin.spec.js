import { test, expect } from "playwright-test-coverage";
import { v4 as uuidv4 } from "uuid";

let sharedName;
let sharedEmail;
let sharedPassword;
let registerEmail;
let registerPassword;

// Before All

test.beforeAll(async () => {
    sharedName = "Test Admin";
    sharedEmail = `testadmin_${uuidv4()}@jwt.com`;
    sharedPassword = "testpassword";

    // Create a new user
    const registerReq = { email: sharedEmail, password: sharedPassword };
});

async function loginAdmin(page, email, password) {
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() === "PUT") {
            const loginReq = { email, password };
            const loginRes = {
                user: {
                    id: uuidv4(),
                    name: "Test Admin",
                    email,
                    roles: [{ role: "admin" }],
                },
                token: "abcdef",
            };
            expect(route.request().method()).toBe("PUT");
            expect(route.request().postDataJSON()).toMatchObject(loginReq);
            await route.fulfill({ json: loginRes });
        }
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);

    await page.getByRole("button", { name: "Login" }).click();
}

// Test admin login
test("login", async ({ page }) => {
    await loginAdmin(page, sharedEmail, sharedPassword);
    await expect(page.getByRole("link", { name: "TA" })).toBeVisible();
});

// Test Admin Dashboard
test("admin dashboard", async ({ page }) => {
    await loginAdmin(page, sharedEmail, sharedPassword);
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(
        page.getByRole("link", { name: "admin-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
});
