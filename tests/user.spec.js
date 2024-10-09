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
    await loginUser(page, sharedEmail, sharedPassword);
    await logoutUser(page);
    // Check that user is logged out and back on home page
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    expect(await page.title()).toBe("JWT Pizza");
});

// // Move test to order page
// test("purchase with login", async ({ page }) => {
//     await page.route("*/**/api/order/menu", async (route) => {
//         const menuRes = [
//             {
//                 id: 1,
//                 title: "Veggie",
//                 image: "pizza1.png",
//                 price: 0.0038,
//                 description: "A garden of delight",
//             },
//             {
//                 id: 2,
//                 title: "Pepperoni",
//                 image: "pizza2.png",
//                 price: 0.0042,
//                 description: "Spicy treat",
//             },
//         ];
//         expect(route.request().method()).toBe("GET");
//         await route.fulfill({ json: menuRes });
//     });

//     await page.route("*/**/api/franchise", async (route) => {
//         const franchiseRes = [
//             {
//                 id: 2,
//                 name: "LotaPizza",
//                 stores: [
//                     { id: 4, name: "Lehi" },
//                     { id: 5, name: "Springville" },
//                     { id: 6, name: "American Fork" },
//                 ],
//             },
//             {
//                 id: 3,
//                 name: "PizzaCorp",
//                 stores: [{ id: 7, name: "Spanish Fork" }],
//             },
//             { id: 4, name: "topSpot", stores: [] },
//         ];
//         expect(route.request().method()).toBe("GET");
//         await route.fulfill({ json: franchiseRes });
//     });

//     await page.route("*/**/api/order", async (route) => {
//         const orderReq = {
//             items: [
//                 { menuId: 1, description: "Veggie", price: 0.0038 },
//                 { menuId: 2, description: "Pepperoni", price: 0.0042 },
//             ],
//             storeId: "4",
//             franchiseId: 2,
//         };
//         const orderRes = {
//             order: {
//                 items: [
//                     { menuId: 1, description: "Veggie", price: 0.0038 },
//                     { menuId: 2, description: "Pepperoni", price: 0.0042 },
//                 ],
//                 storeId: "4",
//                 franchiseId: 2,
//                 id: 23,
//             },
//             jwt: "eyJpYXQ",
//         };
//         expect(route.request().method()).toBe("POST");
//         expect(route.request().postDataJSON()).toMatchObject(orderReq);
//         await route.fulfill({ json: orderRes });
//     });

//     await page.goto("http://localhost:5173/");

//     // Go to order page
//     await page.getByRole("button", { name: "Order now" }).click();

//     // Create order
//     await expect(page.locator("h2")).toContainText("Awesome is a click away");
//     await page.getByRole("combobox").selectOption("4");
//     await page
//         .getByRole("link", { name: "Image Description Veggie A" })
//         .click();
//     await page
//         .getByRole("link", { name: "Image Description Pepperoni" })
//         .click();
//     await expect(page.locator("form")).toContainText("Selected pizzas: 2");
//     await page.getByRole("button", { name: "Checkout" }).click();

//     // Login
//     await page.getByPlaceholder("Email address").click();
//     await page.getByPlaceholder("Email address").fill(sharedEmail);
//     await page.getByPlaceholder("Password").press("Tab");
//     await page.getByPlaceholder("Password").fill(sharedPassword);
//     await page.getByRole("button", { name: "Login" }).click();

//     // Pay
//     await expect(page.getByRole("main")).toContainText(
//         "Send me those 2 pizzas right now!"
//     );
//     await expect(page.locator("tbody")).toContainText("Veggie");
//     await expect(page.locator("tbody")).toContainText("Pepperoni");
//     await expect(page.locator("tfoot")).toContainText("0.008 ₿");
//     await page.getByRole("button", { name: "Pay now" }).click();

//     // Check balance
//     await expect(page.getByText("0.008")).toBeVisible();
// });
