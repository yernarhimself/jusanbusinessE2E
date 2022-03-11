import { test, expect} from '@playwright/test';

const iin = '950419300174';
const phone = '+77750697841';
const basicAuthHeader = 'Basic d2ViYXBwOnJqWkk5TWZRT2Y=';

test('Register account', async ({page, request}) => {
  const basicAuth = await request.post(`api/v1/oauth/token`, {
    headers: {
      'Authorization': basicAuthHeader
    },
    form: {
      grant_type: 'client_credentials',
      scope: 'bankingapi'
    },
  });
  expect(basicAuth.ok()).toBeTruthy();
  const bodyText = await basicAuth.text();
  const body = JSON.parse(bodyText);
  const accessToken = body.access_token;
  console.log(`Client tokes is: ${accessToken}`);

  await request.delete(`api/v1/users?phone=` + phone, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
  });
  await page.goto('/');
  await page.locator('text=Зарегистрироваться').click();
  await expect(page).toHaveURL(`/auth/register/iin`);
  await page.locator('input[name="iin"]').fill(iin);
  await page.locator('text=Продолжить').click();
  await expect(page).toHaveURL(`/auth/register/phone`);
  await page.locator('input[type="undefined"]').fill(phone);
  await Promise.all([
    page.waitForNavigation(),
    page.locator('text=Продолжить').click()
  ]);
  const smsResponse = page.waitForResponse(`/api/v1/auth/phone/token`);
  var response = await smsResponse;
  let smsResp = await response.json();
  const smsCode = smsResp["code"];
  console.log(`SMS code is: ${smsCode}`)
  await Promise.all([
    page.waitForNavigation(),
    page.locator('input').fill(smsCode)
  ]);
  const emailResponse = page.waitForResponse(`/api/v1/auth/email/token`);
  var response = await emailResponse;
  let emailResp = await response.json();
  const emailCode = emailResp["code"];
  console.log(`Email code is: ${emailCode}`)
  await Promise.all([
    page.waitForNavigation(),
    page.locator('input').fill(emailCode)
  ]);
  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
  const rndInt = randomIntFromInterval(2022, 99999)
  const newPass = "Strong" + (rndInt) + "!";
  console.log(`Password is: ${newPass}`);
  await page.locator('input[type="password"]').first().fill(newPass);
  await page.locator('input[type="password"]').nth(1).click();
  await page.locator('input[type="password"]').nth(1).fill(newPass);
  await Promise.all([
    page.waitForNavigation(),
    page.locator('button:has-text("Готово")').click()
  ]);
  await page.locator('text=Войти в банкинг').click();
  await page.locator('text=Выход').click();
  await expect(page).toHaveURL(`/auth/login`);
});