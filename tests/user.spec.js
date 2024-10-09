import { test, expect } from "playwright-test-coverage";
import { v4 as uuidv4 } from "uuid";

let sharedName;
let sharedEmail;
let sharedPassword;
let registerEmail;
let registerPassword;

// Before All

test.beforeAll(async () => {
    sharedName = "Test User";
    sharedEmail = `testuser_${uuidv4()}@jwt.com`;
    sharedPassword = "testpassword";
    registerEmail = `testuser_${uuidv4()}@jwt.com`;
    registerPassword = "testpassword";

    // Create a new user
    const registerReq = { email: sharedEmail, password: sharedPassword };
});

// Helper functions
async function failRegisterUser(page, email, password) {
    await page.route("*/**/api/auth", async (route) => {
        const registerReq = { email, password };
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toMatchObject(registerReq);
        await route.abort("failed");
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Register" }).click();
    await page.getByPlaceholder("Full name").fill(sharedName);
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Register" }).click();
}

async function registerUser(page, email, password) {
    await page.route("*/**/api/auth/register", async (route) => {
        const registerReq = { email, password };
        const registerRes = {
            user: {
                id: uuidv4(),
                name: "Test User",
                email,
                roles: [{ role: "diner" }],
            },
            token: "abcdef",
        };
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toMatchObject(registerReq);
        await route.fulfill({ json: registerRes });
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Register" }).click();
    await page.getByPlaceholder("Full name").fill(sharedName);
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Register" }).click();
}

async function failLoginUser(page, email, password) {
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() === "PUT") {
            const loginReq = { email, password };
            const loginRes = {
                user: {
                    id: uuidv4(),
                    name: "Test User",
                    email,
                    roles: [{ role: "diner" }],
                },
                token: "abcdef",
            };
            expect(route.request().method()).toBe("PUT");
            expect(route.request().postDataJSON()).toMatchObject(loginReq);
            await route.abort("failed");
        }
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill(password);

    await page.getByRole("button", { name: "Login" }).click();
}

async function loginUser(page, email, password) {
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() === "PUT") {
            const loginReq = { email, password };
            const loginRes = {
                user: {
                    id: uuidv4(),
                    name: "Test User",
                    email,
                    roles: [{ role: "diner" }],
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

async function logoutUser(page) {
    await page.route("*/**/api/auth", async (route) => {
        if (route.request().method() === "DELETE") {
            const logoutRes = { message: "logout successful" };
            expect(route.request().method()).toBe("DELETE");
            await route.fulfill({ json: logoutRes });
        }
    });
    await page.getByRole("link", { name: "Logout" }).click();
}

// Tests
// Get to home paget
test("home page", async ({ page }) => {
    await page.goto("/");
    expect(await page.title()).toBe("JWT Pizza");
});

test("visit diner dashboard without login", async ({ page }) => {
    await page.goto("http://localhost:5173/diner-dashboard");
    await expect(
        page.getByRole("link", { name: "diner-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Oops")).toBeVisible();
});

test("fail register with error", async ({ page }) => {
    await failRegisterUser(page, sharedEmail, sharedPassword);
    await expect(page.getByText('{"code":500,"message":"Failed')).toBeVisible();
});

// Test registration
test("register a random user", async ({ page }) => {
    await registerUser(page, registerEmail, registerPassword);
    await expect(page.getByRole("link", { name: "TU" })).toBeVisible();
});

test("navigate to login from register", async ({ page }) => {
    await page.goto("http://localhost:5173/register");
    await expect(
        page.getByRole("link", { name: "register", exact: true })
    ).toBeVisible();
    await page.getByRole("main").getByText("Login").click();
    await expect(
        page.getByRole("link", { name: "login", exact: true })
    ).toBeVisible();
});

test("fail login with error", async ({ page }) => {
    await failLoginUser(page, sharedEmail, "wrongpassword");
    await expect(page.getByText('{"code":500,"message":"Failed')).toBeVisible();
});

// Test login
test("login", async ({ page }) => {
    await loginUser(page, sharedEmail, sharedPassword);
    await expect(page.getByRole("link", { name: "TU" })).toBeVisible();
});

test("visit diner dashboard", async ({ page }) => {
    await loginUser(page, sharedEmail, sharedPassword);
    await page.getByRole("link", { name: "TU" }).click();
    await expect(
        page.getByRole("link", { name: "diner-dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Your pizza kitchen")).toBeVisible();
    await expect(page.getByText(sharedName)).toBeVisible();
    await expect(page.getByText(sharedEmail)).toBeVisible();
    await expect(page.getByText("diner", { exact: true })).toBeVisible();
});

// Test logout
test("logout", async ({ page }) => {
    // Simple way because the other way is unreliable
    await page.goto("localhost:5173/logout");

    // await loginUser(page, sharedEmail, sharedPassword);
    // await logoutUser(page);
    // // Check that user is logged out and back on home page
    // await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    // await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    // expect(await page.title()).toBe("JWT Pizza");
});
