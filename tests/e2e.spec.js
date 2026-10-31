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
  await page.mouse.wheel(0, 100);
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
  await page.mouse.wheel(0, 80);
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

test('full-width hairline aligns with content; sweep starts with aura', async ({ page }) => {
  await page.setViewportSize({width:1280,height:800});await page.goto('/');
  await expect(page.locator('.brand-sub')).toHaveText('PERSONAL SPACE');
  await settled(page);
  await expect(page.locator('.startup-glow')).toBeVisible({timeout:5000});
  const sweep=await page.locator('.startup-glow').evaluate(e=>getComputedStyle(e).animationDuration);
  expect(sweep).toBe('1.1s');
  expect(await page.locator('.startup-glow').evaluate(e=>getComputedStyle(e).animationIterationCount)).toBe('2');
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  expect(await page.locator('.section-bar').evaluate(e=>e.getBoundingClientRect().width)).toBe(1280);
  const alignment = await page.evaluate(()=>({marker:document.querySelector('.section-bar-inner').getBoundingClientRect().left,title:document.querySelector('#connections-title').getBoundingClientRect().left}));
  expect(Math.abs(alignment.marker-alignment.title)).toBeLessThan(1);
  await page.evaluate(()=>window.scrollTo({top:60,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('00 / 首页');
  await page.evaluate(()=>window.scrollTo({top:document.querySelector('.section-bar').getBoundingClientRect().top+scrollY-70,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('01 / 我的数字坐标');
  await page.screenshot({path:'test-results/section-handoff.png'});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.brand-sub')).toHaveText('PERSONAL SPACE');
});

test('sweep shares aura start and has dim ends with a bright center', async ({ page }) => {
  await page.addInitScript(()=>{
    window.motionStarts={};
    document.addEventListener('animationstart',e=>{
      if(e.animationName==='aura-bloom'||e.animationName==='startup-sweep')window.motionStarts[e.animationName]=performance.now();
    },true);
  });
  await page.goto('/');await expect(page.locator('.startup-glow')).toBeVisible();
  const result=await page.evaluate(()=>{
    const element=document.querySelector('.startup-glow');
    const animation=element.getAnimations()[0]; animation.pause();
    const samples=[110,550,990].map(time=>{animation.currentTime=time;const style=getComputedStyle(element);return {opacity:Number(style.opacity),x:element.getBoundingClientRect().x}});
    animation.play();return {samples,starts:window.motionStarts};
  });
  expect(Math.abs(result.starts['startup-sweep']-result.starts['aura-bloom'])).toBeLessThan(100);
  expect(result.samples[1].opacity).toBeGreaterThan(result.samples[0].opacity);
  expect(result.samples[1].opacity).toBeGreaterThan(result.samples[2].opacity);
  expect(result.samples[0].x).toBeLessThan(result.samples[1].x);
  expect(result.samples[1].x).toBeLessThan(result.samples[2].x);
});

test('desktop first downward wheel reveals the entire grid across screen proportions', async ({ page }) => {
  for(const [width,height] of [[1280,600],[1280,800],[1920,1080],[1600,1200]]) {
    await page.setViewportSize({width,height});await page.goto('/');await settled(page);
    const grid=page.locator('.social-grid');
    await expect(grid).not.toHaveClass(/is-revealed/);
    await expect(grid.locator('.social-card').first()).toHaveCSS('opacity','0');
    await page.mouse.move(10,150);await page.mouse.wheel(0,-10);
    await expect(grid).not.toHaveClass(/is-revealed/);
    await page.mouse.wheel(0,24);
    await expect(grid).toHaveClass(/is-revealed/);
    await expect(grid.locator('.social-card').last()).toHaveCSS('opacity','1');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await expect(grid).not.toHaveClass(/is-revealed/);
    await expect(grid.locator('.social-card').first()).toHaveCSS('opacity','0');
    const geometry=await page.evaluate(()=>{
      const header=document.querySelector('header').getBoundingClientRect();
      const card=document.querySelector('.float-anchor').getBoundingClientRect();
      return {header:header.height,ratio:card.width/card.height,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
    });
    expect(geometry.header).toBeLessThanOrEqual(112);
    expect(Math.abs(geometry.ratio-342/390)).toBeLessThan(.01);
    expect(geometry.scrollWidth).toBe(geometry.width);
  }
});
test('return beam mirrors the outbound brightness and size profile', async ({ page }) => {
  await page.goto('/');await expect(page.locator('.startup-glow')).toBeVisible();
  const profiles=await page.locator('.startup-glow').evaluate(element=>{
    const animation=element.getAnimations()[0];animation.pause();
    const times=[220,550,880,1320,1650,1980];
    const samples=times.map(t=>{animation.currentTime=t;const r=element.getBoundingClientRect();return {x:r.x,width:r.width,alpha:Number(getComputedStyle(element).opacity)}});
    animation.play();return samples;
  });
  for(let i=0;i<3;i++){
    expect(Math.abs(profiles[i].alpha-profiles[5-i].alpha)).toBeLessThan(.02);
    expect(Math.abs(profiles[i].width-profiles[5-i].width)).toBeLessThan(1);
  }
  expect(profiles[3].x).toBeGreaterThan(profiles[4].x);
  expect(profiles[4].x).toBeGreaterThan(profiles[5].x);
});

test('interrupted startup beam hands its current position to scroll light quickly', async ({ page }) => {
  await page.goto('/');await expect(page.locator('.startup-glow')).toBeVisible();
  const handoff=await page.evaluate(async()=>{
    const from=document.querySelector('.startup-glow').getBoundingClientRect().left;
    window.dispatchEvent(new WheelEvent('wheel',{deltaY:100}));
    window.scrollTo({top:100,behavior:'instant'});
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
    const animation=document.querySelector('.header-glow').getAnimations().find(a=>a.id==='scroll-light-handoff');
    return {from, duration:animation?.effect.getTiming().duration, start:animation?.effect.getKeyframes()[0].left};
  });
  expect(handoff.duration).toBe(130);
  expect(Math.abs(parseFloat(handoff.start)-handoff.from)).toBeLessThan(1);
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  await expect(page.locator('.header-track')).not.toHaveClass(/is-handoff/);
});
test('desktop grid retreats after a top dwell and can rise again without a reload', async ({ page }) => {
  await page.goto('/');await settled(page);
  const grid=page.locator('.social-grid'), first=grid.locator('.social-card').first();
  await page.mouse.wheel(0,120);await expect(grid).toHaveClass(/is-revealed/);await expect(first).toHaveCSS('opacity','1');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(90);await expect(grid).toHaveClass(/is-revealed/);
  await expect(grid).not.toHaveClass(/is-revealed/);
  await expect(first).toHaveCSS('opacity','0');
  await expect(grid).toHaveAttribute('inert','');
  await page.mouse.wheel(0,24);await expect(grid).toHaveClass(/is-revealed/);await expect(first).toHaveCSS('opacity','1');
  await expect(grid).not.toHaveAttribute('inert','');
});


test('startup finish never exposes the idle progress beam during track fadeout', async ({ page }) => {
  await page.goto('/');await expect(page.locator('.startup-glow')).toBeVisible();
  await expect(page.locator('.startup-glow')).toHaveCount(0);
  const samples=await page.evaluate(()=>new Promise(resolve=>{
    const out=[],start=performance.now();
    function frame(){out.push(Number(getComputedStyle(document.querySelector('.header-glow')).opacity));if(performance.now()-start<300)requestAnimationFrame(frame);else resolve(out)}frame();
  }));
  expect(samples.every(alpha=>alpha===0)).toBe(true);
  await page.mouse.wheel(0,100);
  await expect(page.locator('.header-glow')).toHaveCSS('opacity','1');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.header-glow')).toHaveCSS('opacity','0');
});
