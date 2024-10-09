import { test, expect } from "playwright-test-coverage";
import { v4 as uuidv4 } from "uuid";

let sharedID;
let sharedName;
let sharedNameInitials;
let sharedEmail;
let sharedPassword;
let sharedFranchiseName;
let sharedStoreName;

// Before All
test.beforeAll(async () => {
    sharedID = uuidv4();
    sharedName = "Test Franchise";
    sharedNameInitials = "TF";
    sharedEmail = `testfranchise_${uuidv4()}@jwt.com`;
    sharedPassword = "testpassword";
    sharedFranchiseName = "Mama Ricci's kitchen";
    sharedStoreName = "Mama Ricci's kitchen - Store";

    // Create a new user
    const registerReq = { email: sharedEmail, password: sharedPassword };
});

// Helper functions
async function loginFranchisee(page, email, password) {
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() === "PUT") {
            const loginReq = { email, password };
            const loginRes = {
                user: {
                    id: sharedID,
                    name: sharedName,
                    email,
                    roles: [{ role: "franchisee" }],
                },
                token: "abcdef",
            };
            expect(route.request().method()).toBe("PUT");
            expect(route.request().postDataJSON()).toMatchObject(loginReq);
            await route.fulfill({ json: loginRes });
        }
    });
    await page.route("*/**/api/franchise/*", async (route) => {
        if (route.request().method() === "GET") {
            const getFranchiseRes = [
                {
                    id: sharedID,
                    name: sharedFranchiseName,
                    admins: [
                        {
                            id: sharedID,
                            name: sharedName,
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

    await expect(page.getByRole("link", { name: "TF" })).toBeVisible();

    await page
        .getByLabel("Global")
        .getByRole("link", { name: "Franchise" })
        .click();
    await expect(
        page.getByRole("link", { name: "franchise-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
}

async function createStore(page, name) {
    await page.route("*/**/api/franchise/*/store", async (route) => {
        if (route.request().method() === "POST") {
            const createStoreReq = { name };
            const createStoreRes = {
                id: uuidv4(),
                franchiseId: sharedID,
                name,
            };
            expect(route.request().method()).toBe("POST");
            expect(route.request().postDataJSON()).toMatchObject(
                createStoreReq
            );
            await route.fulfill({ json: createStoreRes });
        }
    });
    await page.route("*/**/api/franchise/*", async (route) => {
        if (route.request().method() === "GET") {
            const getFranchiseRes = [
                {
                    id: sharedID,
                    name: sharedFranchiseName,
                    admins: [
                        {
                            id: sharedID,
                            name: sharedName,
                            email: sharedEmail,
                        },
                    ],
                    stores: [
                        {
                            id: sharedID,
                            name: name,
                            totalRevenue: 3.14,
                        },
                    ],
                },
            ];
            await route.fulfill({ json: getFranchiseRes });
        }
    });
    await page.route("*/**/api/franchise/*/store/*", async (route) => {
        if (route.request().method() === "DELETE") {
            const deleteStoreRes = { message: "store deleted" };
            expect(route.request().method()).toBe("DELETE");
            await route.fulfill({ json: deleteStoreRes });
        }
    });

    await page
        .getByLabel("Global")
        .getByRole("link", { name: "Franchise" })
        .click();
    await page.getByRole("button", { name: "Create store" }).click();
    await expect(
        page.getByRole("link", { name: "create-store" })
    ).toBeVisible();
    await expect(page.getByText("Create store")).toBeVisible();
    await page.getByPlaceholder("store name").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();
}

// Test Franchisee login
test("login", async ({ page }) => {
    await loginFranchisee(page, sharedEmail, sharedPassword);
});

test("visit diner dashboard", async ({ page }) => {
    await loginFranchisee(page, sharedEmail, sharedPassword);
    await page.getByRole("link", { name: "TF" }).click();
    await expect(
        page.getByRole("link", { name: "diner-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Your pizza kitchen")).toBeVisible();
    await expect(page.getByText(sharedName)).toBeVisible();
    await expect(page.getByText(sharedEmail)).toBeVisible();
    await expect(page.getByText("Franchisee on")).toBeVisible();
});

// Test Store creation
test("create store", async ({ page }) => {
    await loginFranchisee(page, sharedEmail, sharedPassword);
    await createStore(page, sharedStoreName);
});

// Test Store deletion
test("delete store", async ({ page }) => {
    await loginFranchisee(page, sharedEmail, sharedPassword);
    await createStore(page, sharedStoreName);

    // Delete store
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("link", { name: "close-store" })).toBeVisible();
    await expect(page.getByText("Sorry to see you go")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(
        page.getByText("Mama Ricci's kitchen", { exact: true })
    ).toBeVisible();
});
