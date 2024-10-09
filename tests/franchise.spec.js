import { test, expect } from "playwright-test-coverage";
import { v4 as uuidv4 } from "uuid";

let sharedID;
let sharedName;
let sharedEmail;
let sharedPassword;
let sharedFranchiseName;

// Before All
test.beforeAll(async () => {
    sharedID = uuidv4();
    sharedName = "Test Franchise";
    sharedEmail = `testfranchise_${uuidv4()}@jwt.com`;
    sharedPassword = "testpassword";
    sharedFranchiseName = "Mama Ricci's kitchen";

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
}

async function createStore(page, name) {}

// Test Franchisee login
test("login", async ({ page }) => {
    await loginFranchisee(page, sharedEmail, sharedPassword);
    await expect(page.getByRole("link", { name: "TF" })).toBeVisible();
    await page
        .getByLabel("Global")
        .getByRole("link", { name: "Franchise" })
        .click();
    await expect(
        page.getByRole("link", { name: "franchise-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
});
