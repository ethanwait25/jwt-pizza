import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
    await page.goto('/');
  
    expect(await page.title()).toBe('JWT Pizza');
});

test('buy pizza with login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Order now' }).click();
    await expect(page.getByText('Awesome is a click away')).toBeVisible();
    await page.getByRole('combobox').selectOption('2');
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await page.getByRole('link', { name: 'Image Description Margarita' }).click();
    await page.getByRole('link', { name: 'Image Description Chared' }).click();
    await expect(page.getByText('Selected pizzas:')).toBeVisible();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Send me those 3 pizzas right')).toBeVisible();
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByText('0.016 ₿')).toBeVisible();
});