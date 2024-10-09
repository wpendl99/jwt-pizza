import { test, expect } from "playwright-test-coverage";
import { v4 as uuidv4 } from "uuid";

let sharedName;
let sharedEmail;
let sharedPassword;
let sharedFranchiseName;
let sharedFranchiseEmail;

// Before All
test.beforeAll(async () => {
    sharedName = "Test Admin";
    sharedEmail = `testadmin_${uuidv4()}@jwt.com`;
    sharedPassword = "testpassword";
    sharedFranchiseName = "Mama Ricci's kitchen";
    sharedFranchiseEmail = `mamaricci_${uuidv4()}@jwt.com`;

    // Create a new user
    const registerReq = { email: sharedEmail, password: sharedPassword };
});

// Helper functions
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
    await page.route("*/**/api/franchise", async (route) => {
        if (route.request().method() === "GET") {
            const getFranchiseRes = [
                {
                    id: uuidv4(),
                    name: "Mama Ricci's kitchen",
                    email,
                    admins: [
                        {
                            id: uuidv4(),
                            name: "Test Admin",
                            email: sharedEmail,
                        },
                    ],
                    stores: [],
                },
            ];
            await route.fulfill({ json: getFranchiseRes });
        }
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);

    await page.getByRole("button", { name: "Login" }).click();
}

async function createFranchise(page, name, email) {
    await page.route("*/**/api/franchise", async (route) => {
        if (route.request().method() === "POST") {
            const createFranchiseReq = {
                stores: [],
                name,
                admins: [{ email }],
            };
            const createFranchiseRes = {
                id: uuidv4(),
                name: "Mama Ricci's kitchen",
                email,
                admin: uuidv4(),
            };
            expect(route.request().method()).toBe("POST");
            expect(route.request().postDataJSON()).toMatchObject(
                createFranchiseReq
            );
            await route.fulfill({ json: createFranchiseRes });
        } else if (route.request().method() === "GET") {
            const getFranchiseRes = [
                {
                    id: uuidv4(),
                    name: "Mama Ricci's kitchen",
                    email,
                    admins: [
                        {
                            id: 1,
                            name: sharedName,
                            email: sharedEmail,
                        },
                    ],
                    stores: [
                        {
                            id: 1,
                            name: "Mama Ricci's kitchen - Store 1",
                            totalRevenue: 9.34,
                        },
                    ],
                },
            ];
            await route.fulfill({ json: getFranchiseRes });
        }
    });
    await page.route("*/**/api/franchise/**/*", async (route) => {
        if (route.request().method() === "DELETE") {
            const closeFranchiseRes = { message: "franchise/store deleted" };
            expect(route.request().method()).toBe("DELETE");
            await route.fulfill({ json: closeFranchiseRes });
        }
    });

    await page.goto("/admin-dashboard");
    await page.getByRole("button", { name: "Add Franchise" }).click();
    await expect(
        page.getByRole("link", { name: "create-franchise" })
    ).toBeVisible();
    await page.getByPlaceholder("franchise name").fill(name);
    await page.getByPlaceholder("franchisee admin email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();
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
    await expect(
        page
            .getByRole("heading", { name: "Mama Ricci's kitchen" })
            .locator("span")
    ).toBeVisible();
});

// Test create franchise
test("create franchise", async ({ page }) => {
    await loginAdmin(page, sharedEmail, sharedPassword);
    await createFranchise(page, sharedFranchiseName, sharedEmail);
});

// Test close store
test("close store", async ({ page }) => {
    await loginAdmin(page, sharedEmail, sharedPassword);
    await createFranchise(page, sharedFranchiseName, sharedEmail);

    // Cancel first them close
    await page
        .getByRole("row", { name: "Mama Ricci's kitchen - Store" })
        .getByRole("button")
        .click();
    await expect(page.getByRole("link", { name: "close-store" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
        page
            .getByRole("heading", { name: "Mama Ricci's kitchen" })
            .locator("span")
    ).toBeVisible();

    // Close store
    await page
        .getByRole("row", { name: "Mama Ricci's kitchen - Store" })
        .getByRole("button")
        .click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(
        page
            .getByRole("heading", { name: "Mama Ricci's kitchen" })
            .locator("span")
    ).toBeVisible();
});

// Test close franchise
test("close franchise", async ({ page }) => {
    await loginAdmin(page, sharedEmail, sharedPassword);
    await createFranchise(page, sharedFranchiseName, sharedEmail);

    // Cancel first them close
    await page
        .getByRole("row", { name: "Mama Ricci's kitchen Test" })
        .getByRole("button")
        .click();
    await expect(
        page.getByRole("link", { name: "close-franchise" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
        page
            .getByRole("heading", { name: "Mama Ricci's kitchen" })
            .locator("span")
    ).toBeVisible();

    // Close franchise
    await page
        .getByRole("row", { name: "Mama Ricci's kitchen Test" })
        .getByRole("button")
        .click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(
        page
            .getByRole("heading", { name: "Mama Ricci's kitchen" })
            .locator("span")
    ).toBeVisible();
});
