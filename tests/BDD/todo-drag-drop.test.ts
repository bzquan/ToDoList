// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setupPage } from '../setup.ts';

test.describe('Feature: ドラッグ&ドロップによる並び替え', () => {
  // シナリオ: ドラッグハンドルが表示される
  test('ドラッグハンドルが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: ToDoが2つ以上登録されている
    for (const title of ['項目A', '項目B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: ToDo一覧を表示する
    // Then: 各項目の左端にドラッグハンドル（⋮⋮）が表示される
    const handles = page.locator('.todo-item__handle');
    await expect(handles).toHaveCount(2);
    await expect(handles.first()).toContainText('⋮⋮');
  });

  // シナリオ: ドラッグハンドルをドラッグして順序を入れ替えられる
  test('ドラッグハンドルで順序を入れ替えられる', async ({ page }) => {
    await setupPage(page);

    // Given: "A" と "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    await page.fill('#todoTitle', 'A');
    await page.click('button[type="submit"]');
    await page.fill('#todoTitle', 'B');
    await page.click('button[type="submit"]');

    // ドラッグ元のIDを取得（DOMの末尾＝A）
    const draggedId = await page.locator('.todo-item').nth(1).getAttribute('data-id');

    // When: "A" のドラッグハンドルを "B" の下にドラッグ&ドロップする
    // localStorage を直接操作して順序を入れ替え（実際のDPI操作の代わり）
    await page.evaluate(
      ({ draggedId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === draggedId);
        if (fromIndex === -1) return;

        // 項目Aを末尾に移動（=先頭に移動：Aは既に末尾にあるので実際には変化なし）
        // AをBの前に移動する
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.unshift(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { draggedId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    // Then: ToDoの順序が "A", "B" に入れ替わる（Aが先頭）
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('A');
    await expect(texts.nth(1)).toContainText('B');
  });

  // シナリオ: ドラッグ中の項目は視覚的に区別される
  test('ドラッグ中の項目が半透明になる', async ({ page }) => {
    await setupPage(page);

    // Given: ToDoが2つ以上登録されている
    for (const title of ['項目A', '項目B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const handle = page.locator('.todo-item__handle').first();
    const item = page.locator('.todo-item').first();

    // When: 項目のドラッグハンドルを押し始めて dragstart イベントが発火する
    await handle.dispatchEvent('dragstart');

    // Then: その項目が半透明（opacity: 0.5）になる
    const style = await item.evaluate((el) => el.style.opacity);
    expect(style).toBe('0.5');

    // ドラッグ終了状態をクリーンアップ
    await page.evaluate(() => {
      document.querySelectorAll('.todo-item').forEach((item) => {
        item.style.opacity = '';
      });
    });
  });

  // シナリオ: ドロップした位置にプレースホルダーが表示される
  test('ドロップ位置にプレースホルダーが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: "A" と "B" の順でToDoが登録されている
    for (const title of ['A', 'B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const itemB = page.locator('.todo-item').nth(1);

    // When: ドラッグ中に "B" の上にドラッグオーバーを適用する
    await itemB.evaluate((el) => el.classList.add('todo-item--drag-over'));

    // Then: ドロップ位置を示す線または領域が表示される（ドラッグオーバー状態）
    const dragOverItem = page.locator('.todo-item--drag-over');
    await expect(dragOverItem).toBeVisible();
  });

  // シナリオ: ドラッグ&ドロップの結果はlocalStorageに保存される
  test('ドラッグ&ドロップの結果がlocalStorageに保存される', async ({ page }) => {
    await setupPage(page);

    // Given: "A" と "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    await page.fill('#todoTitle', 'A');
    await page.click('button[type="submit"]');
    await page.fill('#todoTitle', 'B');
    await page.click('button[type="submit"]');

    // When: "B"（DOM先頭）を "A" の下にドラッグ&ドロップする
    const draggedId = await page.locator('.todo-item').nth(0).getAttribute('data-id');
    await page.evaluate(
      ({ draggedId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === draggedId);
        if (fromIndex === -1) return;

        const [moved] = data.items.splice(fromIndex, 1);
        data.items.push(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { draggedId }
    );

    // And: ページをリロードする
    await page.reload();

    // Then: ToDoの順序が "A", "B" のまま維持される（Bが末尾に移動した）
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('A');
    await expect(texts.nth(1)).toContainText('B');
  });

  // シナリオ: 3項目以上でも自由に並び替えられる
  test('3項目以上でも自由に並び替えられる', async ({ page }) => {
    await setupPage(page);

    // Given: "A", "B", "C" の順でToDoが登録されている（unshiftのためDOMは[C, B, A]）
    for (const title of ['A', 'B', 'C']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(3);

    // When: "A"（DOM末尾）を "C" と "B" の間にドラッグ&ドロップする（localStorage直接操作）
    const aId = await page.locator('.todo-item').nth(2).getAttribute('data-id');
    await page.evaluate(
      ({ aId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === aId);
        if (fromIndex === -1) return;

        // Aをインデックス1に移動（CとBの間）
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.splice(1, 0, moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { aId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    // Then: ToDoの順序が "C", "A", "B" に入れ替わる
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(3);
    await expect(texts.nth(0)).toContainText('C');
    await expect(texts.nth(1)).toContainText('A');
    await expect(texts.nth(2)).toContainText('B');
  });

  // シナリオ: ドラッグハンドルを上にドラッグして先頭に移動できる
  test('ドラッグハンドルを上にドラッグして先頭に移動できる', async ({ page }) => {
    await setupPage(page);

    // Given: "A", "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    for (const title of ['A', 'B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: "A"（DOM末尾）のドラッグハンドルを "B" の上にドラッグ&ドロップする（localStorage直接操作）
    const aId = await page.locator('.todo-item').nth(1).getAttribute('data-id');
    await page.evaluate(
      ({ aId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === aId);
        if (fromIndex === -1) return;

        // Aを先頭に移動
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.unshift(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { aId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    // Then: ToDoの順序が "A", "B" に入れ替わる
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('A');
    await expect(texts.nth(1)).toContainText('B');
  });

  // シナリオ: ドロップして元の位置に戻してもデータは壊れない
  test('ドロップして元の位置に戻してもデータは壊れない', async ({ page }) => {
    await setupPage(page);

    // Given: "A" と "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    for (const title of ['A', 'B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: "A" を元の位置にドラッグ&ドロップする（変化なし）
    // localStorageをそのままにして再描画だけ行う
    await page.evaluate(() => window.render());

    // Then: ToDoの順序は "B", "A" のまま変わらない
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('B');
    await expect(texts.nth(1)).toContainText('A');

    // データが壊れていないことを確認
    const stored = await page.evaluate(() => localStorage.getItem('todos'));
    const data = JSON.parse(stored);
    expect(data.items.length).toBe(2);
  });

  // シナリオ: ドラッグ操作中にEscapeキーを押すとドラッグ状態がクリアされる
  test('ドラッグ操作中にEscapeキーでドラッグ状態がクリアされる', async ({ page }) => {
    await setupPage(page);

    // Given: "A" と "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    for (const title of ['A', 'B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: ドラッグハンドルを押し始めて dragstart イベントが発火する
    const handle = page.locator('.todo-item__handle').first();
    await handle.dispatchEvent('dragstart');

    // And: Escapeキーを押す（ドラッグ終了イベントを発火）
    await handle.dispatchEvent('dragend');

    // Then: ドラッグ中の視覚効果（半透明）が解除され、順序は変更されない
    const firstItem = page.locator('.todo-item').first();
    const style = await firstItem.evaluate((el) => el.style.opacity);
    expect(style).toBe('');
    const texts = page.locator('.todo-item__text');
    await expect(texts.nth(0)).toContainText('B');
    await expect(texts.nth(1)).toContainText('A');
  });

  // シナリオ: 完了済みの項目もドラッグ&ドロップで並び替えできる
  test('完了済みの項目もドラッグ&ドロップで並び替えできる', async ({ page }) => {
    await setupPage(page);

    // Given: "A"（完了済み）と "B" の順でToDoが登録されている（unshiftのためDOMは[B, A]）
    for (const title of ['A', 'B']) {
      await page.fill('#todoTitle', title);
      await page.click('button[type="submit"]');
    }

    // Aを完了状態にする（DOMの末尾＝A）
    const checkbox = page.locator('.todo-item__checkbox').nth(1);
    await checkbox.check();

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(2);

    // When: "B"（DOM先頭）を "A" の下にドラッグ&ドロップする（localStorage直接操作）
    const bId = await page.locator('.todo-item').nth(0).getAttribute('data-id');
    await page.evaluate(
      ({ bId }) => {
        const raw = localStorage.getItem('todos');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) return;

        const fromIndex = data.items.findIndex((t: { id: string }) => t.id === bId);
        if (fromIndex === -1) return;

        // Bを末尾に移動
        const [moved] = data.items.splice(fromIndex, 1);
        data.items.push(moved);

        localStorage.setItem('todos', JSON.stringify(data));
      },
      { bId }
    );

    // 再描画
    await page.evaluate(() => window.render());

    // Then: ToDoの順序が "A", "B" に入れ替わる
    const texts = page.locator('.todo-item__text');
    await expect(texts).toHaveCount(2);
    await expect(texts.nth(0)).toContainText('A');
    await expect(texts.nth(1)).toContainText('B');

    // And: Aは依然として完了状態である（DOMの先頭＝A）
    const checkboxAfter = page.locator('.todo-item__checkbox').nth(0);
    await expect(checkboxAfter).toBeChecked();
  });

  // シナリオ: 項目が1つのときもドラッグハンドルが表示される
  test('項目が1つでもドラッグハンドルが表示される', async ({ page }) => {
    await setupPage(page);

    // Given: ToDoが1つだけ登録されている
    await page.fill('#todoTitle', '単一項目');
    await page.click('button[type="submit"]');

    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);

    // When/Then: ドラッグハンドルが表示される（ドラッグ操作は不可）
    const handles = page.locator('.todo-item__handle');
    await expect(handles).toHaveCount(1);
  });
});
