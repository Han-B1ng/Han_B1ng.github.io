import { test, expect } from "@playwright/test";
const settled = async (page) => {
  await expect(page.locator(".identity-stack")).not.toHaveClass(/is-entering/);
  await expect(page.locator("header")).toHaveCSS("opacity", "1");
};
test("refresh entrance and consecutive turns retain pointer pressure", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await settled(page);
  await page.reload();
  await settled(page);
  const r = await page.locator(".float-anchor").boundingBox();
  await page.mouse.move(r.x + r.width * 0.85, r.y + r.height * 0.5);
  await expect(page.locator(".card-pressure")).not.toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  for (const turn of ["540deg", "720deg"]) {
    await page.mouse.click(r.x + r.width * 0.85, r.y + r.height * 0.5);
    await expect(page.locator(".identity-stack")).toHaveCSS("--turn-y", turn);
    await expect(page.locator(".identity-stack")).not.toHaveClass(/is-turning/);
  }
  expect(errors).toEqual([]);
});
test("image failure, clipboard rejection fallback and accessible share export", async ({
  page,
}) => {
  await page.route("**/avatar.jpg", (route) => route.abort());
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await page.goto("/");
  await settled(page);
  await expect(page.locator(".avatar-error")).toHaveCount(2);
  await page.locator("#connections").scrollIntoViewIfNeeded();
  await page.locator(".card-copy").first().click();
  await expect(page.locator("[role=status]")).toContainText("已复制");
  await page.locator(".share-strip button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".qr-frame img")).toBeVisible();
  await dialog.locator(".poster-button").click();
  await expect(dialog.locator(".poster-preview img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".share-strip button")).toBeFocused();
});
test("language and theme persist; reduced motion can be enabled during entrance", async ({
  page,
}) => {
  await page.goto("/");
  await settled(page);
  await page.locator(".language-button").click();
  await page.locator(".theme-button").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settled(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const positions = await page.evaluate(() => {
    const a = document.querySelector(".float-anchor").getBoundingClientRect(),
      b = document.querySelector(".orbital-two").getBoundingClientRect();
    return Math.abs(a.x + a.width / 2 - b.x - b.width / 2);
  });
  expect(positions).toBeLessThan(2);
});
test("long bilingual accounts fit responsive layouts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 760, 820, 1051, 1180, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await settled(page);
    await page.locator(".language-button").click();
    expect(await page.locator("header").evaluate(e => Math.round(e.getBoundingClientRect().width))).toBe(width);
    const overflow = await page
      .locator(".social-card")
      .evaluateAll(
        (cards) =>
          cards.filter((c) => c.scrollWidth > c.clientWidth + 1).length,
      );
    expect(overflow, `cards at ${width}px`).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      `page at ${width}px`,
    ).toBe(false);
  }
});

test("unconfigured platforms have no empty dialog action", async ({ page }) => {
  await page.route("**/src/config.ts", async route => {
    const response = await route.fetch();
    const source = await response.text();
    expect(source).toContain('account: "Han-B1ng"');
    await route.fulfill({ response, body: source.replace('account: "Han-B1ng"', 'account: ""').replace('url: "https://github.com/Han-B1ng"', 'url: ""') });
  });
  await page.goto("/");
  await settled(page);
  const first = page.locator(".social-card").first();
  await expect(first.locator(".social-status")).toHaveText("即将连接");
  await expect(first.locator(".card-link")).toBeDisabled();
  await expect(first.locator(".card-copy")).toHaveCount(0);
});

test('following header moves its top glow with scroll; language does not restart entry', async ({ page }) => {
  await page.goto('/'); await settled(page);
  await page.locator('.language-button').click();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('.identity-stack')).not.toHaveClass(/is-entering/);
  await page.evaluate(() => window.scrollTo({top: document.querySelector('#connections').getBoundingClientRect().top + scrollY - innerHeight*.32 + 10, behavior:'instant'}));
  await expect(page.locator('header')).toHaveClass(/is-scrolled/);
  await expect(page.locator('.header-section')).toHaveCount(0);
  await page.waitForTimeout(250);
  expect(await page.locator('header').evaluate(e=>e.getBoundingClientRect().width)).toBe(await page.evaluate(()=>innerWidth));
  expect(await page.locator('header').evaluate(e=>Math.abs(e.getBoundingClientRect().top))).toBeLessThan(1);
  const glowBefore = await page.locator('.header-glow').boundingBox();
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await page.waitForTimeout(200);
  const glowAfter = await page.locator('.header-glow').boundingBox();
  expect(glowAfter.x).toBeGreaterThan(glowBefore.x);
  expect(glowAfter.y).toBe(0);
  await page.screenshot({path:'test-results/following-header.png'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.header-track')).not.toHaveClass(/is-active/);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarWidth)).toBe('none');
});

test('section entrance and one startup sweep finish without replay', async ({ page }) => {
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  await expect(page.locator('.section-header')).toHaveClass(/is-entering/);
  await settled(page);
  await expect(page.locator('.section-header')).not.toHaveClass(/is-entering/);
  await expect(page.locator('.startup-glow')).toBeVisible({timeout:5000});
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  const title=await page.locator('#connections-title').boundingBox();
  expect(title.y+title.height).toBeLessThan(800);
  await page.screenshot({path:'test-results/desktop-discovery.png'});
  await page.locator('.language-button').click();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('.startup-glow')).toHaveCount(0);
});
test('mobile scroll cue disappears permanently after scrolling; reduced motion skips sweep', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});await page.goto('/');await settled(page);
  await expect(page.locator('.scroll-cue')).toBeVisible();
  await page.locator('.scroll-cue').click();
  await expect(page.locator('.scroll-cue')).toHaveCount(0);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.scroll-cue')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await settled(page);
  await expect(page.locator('.startup-glow')).toHaveCount(0);
});

test('full-width section hands its identity to the header; sweep waits for landing', async ({ page }) => {
  await page.setViewportSize({width:1280,height:800});await page.goto('/');
  await expect(page.locator('.brand-sub')).toHaveText('PERSONAL SPACE');
  await settled(page);
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  await expect(page.locator('.startup-glow')).toBeVisible({timeout:5000});
  const sweep=await page.locator('.startup-glow').evaluate(e=>getComputedStyle(e).animationDuration);
  expect(sweep).toBe('1.2s');
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  expect(await page.locator('.section-bar').evaluate(e=>e.getBoundingClientRect().width)).toBe(1280);
  await page.evaluate(()=>window.scrollTo({top:60,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('00 / 首页');
  await page.evaluate(()=>window.scrollTo({top:document.querySelector('.section-bar').getBoundingClientRect().top+scrollY-70,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('01 / 我的数字坐标');
  await page.screenshot({path:'test-results/section-handoff.png'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('PERSONAL SPACE');
});
