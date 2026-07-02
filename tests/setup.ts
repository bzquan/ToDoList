// @ts-nocheck
import { Page } from '@playwright/test';
import path from 'path';

/** テスト前に実行する初期化処理 */
export async function setupPage(page: Page) {
  const filePath = path.resolve(__dirname, '../index.html');
  await page.goto('file://' + filePath);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}
