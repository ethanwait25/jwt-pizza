import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
    await page.goto('/');
  
    expect(await page.title()).toBe('JWT Pizza');
});

test('buy pizza with login', async ({ page }) => {
    await page.route('*/**/api/order/menu', async (route) => {
        const menuRes = [
            { id: 2, title: "Pepperoni", image: "pizza2.png", price: 0.0042, description: "Spicy treat" },
            { id: 3, title: "Margarita", image: "pizza3.png", price: 0.0014, description: "Essential classic" },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });

    await page.route('*/**/api/franchise', async (route) => {
        const franchiseRes = [
            {
              id: 2,
              name: 'LotaPizza',
              stores: [
                { id: 4, name: 'Lehi' },
                { id: 5, name: 'Springville' },
                { id: 6, name: 'American Fork' },
              ],
            },
            { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
            { id: 4, name: 'topSpot', stores: [] },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseRes });
    });

    await page.route('*/**/api/auth', async (route) => {
        const loginReq = { 'email': 'd@jwt.com', 'password': 'a' };
        const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });

    await page.route('*/**/api/order', async (route) => {
        const orderReq = {
            items: [
              { menuId: 2, description: 'Pepperoni', price: 0.0042 },
              { menuId: 3, description: 'Margarita', price: 0.0014 },
            ],
            storeId: '4',
            franchiseId: 2,
        };
        const orderRes = {
            order: {
              items: [
                { menuId: 2, description: 'Pepperoni', price: 0.0042 },
                { menuId: 3, description: 'Margarita', price: 0.0014 },
              ],
              storeId: '4',
              franchiseId: 2,
              id: 23,
            },
            jwt: 'eyJpYXQ',
        };
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toMatchObject(orderReq);
        await route.fulfill({ json: orderRes });
    });

    // Navigate to order page
    await page.goto('/');
    await page.getByRole('button', { name: 'Order now' }).click();

    // Create order
    await expect(page.getByText('Awesome is a click away')).toBeVisible();
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await page.getByRole('link', { name: 'Image Description Margarita' }).click();
    await expect(page.getByText('Selected pizzas:')).toBeVisible();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();

    // Pay
    await expect(page.getByText('Send me those 2 pizzas right')).toBeVisible();
    await page.getByRole('button', { name: 'Pay now' }).click();

    // Check order
    await expect(page.getByText('0.006 ₿')).toBeVisible();
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByRole('heading', { name: 'JWT Pizza -' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // Order more takes us back to order page
    await page.getByRole('button', { name: 'Order more' }).click();
    await expect(page.getByText('Awesome is a click away')).toBeVisible();
});

test('register new user and logout', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
        switch (route.request().method()) {
            case 'POST':
                const registerReq = { name: "TestUser", email: "test@test.com", password: "test123" };
                const registerRes = { user: { id: 2, name: "TestUser", "email": "test@test.com", "roles": [{ "role": "diner" }] }, "token": "tttttt" };
                expect(route.request().method()).toBe('POST');
                expect(route.request().postDataJSON()).toMatchObject(registerReq);
                await route.fulfill({ json: registerRes });
                break;
            case 'DELETE':
                await route.fulfill({ json: { message: "logout successful" } });
                break;
        }
    });

    await page.goto('/');

    // Register new user
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByPlaceholder('Full name').fill('TestUser');
    await page.getByPlaceholder('Full name').press('Tab');
    await page.getByPlaceholder('Email address').fill('test@test.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('test123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Navigate to diner dashboard
    await page.getByRole('link', { exact: true, name: 'T' }).click();
    await expect(page.getByText('Your pizza kitchen')).toBeVisible();
    await expect(page.getByText('TestUser')).toBeVisible();
    await expect(page.getByText('diner', { exact: true })).toBeVisible();

    // Logout and return to home page
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
});

test('create franchise functionality with admin', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
        const loginReq = { 'email': 'a@jwt.com', 'password': 'admin' };
        const loginRes = { user: { id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });

    await page.route('*/**/api/franchise', async (route) => {
        switch (route.request().method()) {
            case 'POST':
                const createFranchiseReq = {
                    "stores": [],
                    "name": "testFranchise",
                    "admins": [
                        {
                            "email": "test@test.com"
                        }
                    ]
                }
                const createFranchiseRes = {
                    "name": "testFranchise",
                    "admins": [{
                        "email": "a@jwt.com",
                        "id": 4,
                        "name": "pizza franchisee"
                    }],
                    "id": 1
                }
                expect(route.request().method()).toBe('POST');
                expect(route.request().postDataJSON()).toMatchObject(createFranchiseReq);
                await route.fulfill({ json: createFranchiseRes });
                break;
            case 'GET':
                break;
        }
    });

    await page.goto('/');

    // Login as admin
    await page.getByLabel('Global').click();
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('a@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    // Create franchise
    await page.goto('/admin-dashboard');
    await expect(page.getByText('Keep the dough rolling')).toBeVisible();
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByPlaceholder('franchise name').fill('testFranchise');
    await page.getByPlaceholder('franchisee admin email').fill('test@test.com');
    await page.getByRole('button', { name: 'Create' }).click();
});

test('create store functionality with franchisee', async ({ page }) => {
    await page.route('*/**/api/auth', async (route) => {
        const loginReq = { 'email': 'a@jwt.com', 'password': 'admin' };
        const loginRes = { user: { id: 1, name: 'Admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });

    await page.route('*/**/api/franchise/1/store', async (route) => {
        const createStoreReq = { franchiseId: 1, name: "testStore" }
        const createStoreRes = { id: 1, franchiseId: 1, name: "testStore" };
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toMatchObject(createStoreReq);
        await route.fulfill({ json: createStoreRes });
    });

    await page.goto('/');

    // Login as admin
    await page.getByLabel('Global').click();
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('a@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    // Create store
    await page.goto('/create-store');
    await expect(page.getByText('Create store')).toBeVisible();
    await page.getByPlaceholder('store name').fill('testStore');
    await page.getByRole('button', { name: 'Create' }).click();
});

test('miscellaneous page navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate to franchise page
    await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByText('So you want a piece of the')).toBeVisible();

    // Navigate to about page
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByText('The secret sauce')).toBeVisible();
    await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Brian$/ }).getByRole('img')).toBeVisible();

    // Navigate to history page
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText('Mama Rucci, my my')).toBeVisible();
    await expect(page.getByRole('main').getByRole('img')).toBeVisible();

    // Navigate back to home page
    await page.getByRole('link', { name: 'home' }).click();
    await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
});

test('api docs page', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByText('JWT Pizza API')).toBeVisible();
    await expect(page.getByText('[POST] /api/auth')).toBeVisible();
    const exampleRequest = `curl -X POST localhost:3000/api/auth -d '{"name":"pizza diner", 
        "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`;
    await expect(page.getByText(exampleRequest)).toBeVisible();
});

test('page does not exist', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.getByText('Oops')).toBeVisible();
    await expect(page.getByText('Please try another page.')).toBeVisible();
});