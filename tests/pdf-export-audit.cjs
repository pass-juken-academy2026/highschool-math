'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173/practice.html');
    await page.selectOption('#mode', 'common');
    await page.click('#start');
    await page.waitForSelector('#pdfExportControls:not(.hidden)');

    const openExport = async (button) => {
      const popupPromise = page.waitForEvent('popup');
      await page.click(button);
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      return popup;
    };

    let popup = await openExport('#pdfQuestions');
    let content = await popup.locator('body').innerText();
    assert.match(content, /問題/);
    assert.doesNotMatch(content, /正解：/);
    assert.doesNotMatch(content, /解答・解説/);
    assert.match(content, /文化祭|参加|売上|円|データ/);
    const pdf1 = await popup.pdf({ format: 'A4' }); assert.equal(pdf1.subarray(0, 4).toString(), '%PDF'); assert.ok(pdf1.length > 1000); const pdf2 = await popup.pdf({ format: 'A4' }); assert.equal(pdf2.subarray(0, 4).toString(), '%PDF'); assert.ok(pdf2.length > 1000); const pdf3 = await popup.pdf({ format: 'A4' }); assert.equal(pdf3.subarray(0, 4).toString(), '%PDF'); assert.ok(pdf3.length > 1000); await popup.close();

    popup = await openExport('#pdfAnswers');
    content = await popup.locator('body').innerText();
    assert.match(content, /解答・解説/);
    assert.match(content, /正解：/);
    assert.match(content, /解説：/);
    await popup.close();

    popup = await openExport('#pdfCombined');
    content = await popup.locator('body').innerText();
    assert.match(content, /問題/);
    assert.match(content, /解答・解説/);
    assert.match(content, /正解：/);
    await popup.close();

    console.log('PASS PDF export browser checks: question-only, answer-only, combined');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
