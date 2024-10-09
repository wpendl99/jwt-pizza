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
});

// Helper functions
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

async function viewMenu(page) {
    await page.route("*/**/api/order/menu", async (route) => {
        const menuRes = [
            {
                id: 1,
                title: "Fettuchinni Pizza",
                price: 10.99,
                description: "A delicious pizza",
            },
            {
                id: 2,
                title: "Pepperoni Pasta",
                price: 8.99,
                description: "A delicious pasta",
            },
        ];
        await route.fulfill({ json: menuRes });
    });
    await page.route("*/**/api/franchise", async (route) => {
        const franchiseRes = [
            {
                id: 1,
                name: "SuperPie",
                stores: [
                    {
                        id: 1,
                        name: "Orem",
                    },
                    {
                        id: 2,
                        name: "Provo",
                    },
                    {
                        id: 3,
                        name: "Payson",
                    },
                ],
            },
        ];
        await route.fulfill({ json: franchiseRes });
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Order" }).click();
    await expect(
        page.getByRole("link", { name: "Image Description Fettuchinni" })
    ).toBeVisible();
    await expect(
        page.getByRole("link", { name: "Image Description Pepperoni" })
    ).toBeVisible();
}

async function addItemsToCart(page) {
    await page
        .getByRole("link", { name: "Image Description Fettuchinni" })
        .click();
    await expect(page.getByText("Selected pizzas:")).toContainText("1");
    await page
        .getByRole("link", { name: "Image Description Pepperoni" })
        .click();
    await expect(page.getByText("Selected pizzas:")).toContainText("2");
    // await page.getByRole("button", { name: "Checkout" }).click();
}

async function chooseStore(page) {
    await page.getByRole("combobox").selectOption("1");
    await expect(page.getByRole("combobox")).toHaveValue("1");
}

// Tests
test("viewing the menu", async ({ page }) => {
    await viewMenu(page);
});

test("adding items to the cart", async ({ page }) => {
    await viewMenu(page);
    await addItemsToCart(page);
});

test("choosing a store", async ({ page }) => {
    await viewMenu(page);
    await chooseStore(page);
});

test("Create a checkout order with user not signed in", async ({ page }) => {
    await viewMenu(page);
    await addItemsToCart(page);
    await chooseStore(page);
    await page.getByRole("button", { name: "Checkout" }).click();
    await expect(page.locator("h2")).toContainText("Welcome back");
});

test("Create a checkout order with user signed in", async ({ page }) => {
    await loginUser(page, sharedEmail, sharedPassword);
    await viewMenu(page);
    await addItemsToCart(page);
    await chooseStore(page);
    await page.getByRole("button", { name: "Checkout" }).click();
    await expect(page.locator("h2")).toContainText("So worth it");
});
