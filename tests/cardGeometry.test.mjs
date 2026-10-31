import { test } from "node:test";
import assert from "node:assert/strict";
import { getCardZone, surfacePoint } from "../src/cardGeometry.ts";
test("four intentionally neutral corners and exact boundaries", () => {
  for (const x of [0.01, 0.99])
    for (const y of [0.01, 0.99]) assert.equal(getCardZone(x, y), "none");
  assert.equal(getCardZone(0.14, 0.1), "top");
  assert.equal(getCardZone(0.5, 0.239), "top");
  assert.equal(getCardZone(0.5, 0.24), "right");
  assert.equal(getCardZone(0.5, 0.761), "bottom");
  assert.equal(getCardZone(0.499, 0.5), "left");
});
test("rectangle and mirrored face map screen points to local coordinates", () => {
  const points = [
    { x: 10, y: 20 },
    { x: 110, y: 20 },
    { x: 110, y: 220 },
    { x: 10, y: 220 },
  ];
  assert.deepEqual(surfacePoint(points, 35, 170), { x: 0.25, y: 0.75 });
  assert.deepEqual(
    surfacePoint([points[1], points[0], points[3], points[2]], 35, 170),
    { x: 0.75, y: 0.75 },
  );
});
test("projective mapping round-trips a tilted face", () => {
  // Independent forward homography, with perspective on both axes.
  const project = (u, v) => ({
    x: (100 * u + 20 * v + 30) / (0.2 * u + 0.1 * v + 1),
    y: (10 * u + 150 * v + 40) / (0.2 * u + 0.1 * v + 1),
  });
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([u, v]) => project(u, v));
  for (const [u, v] of [
    [0.2, 0.8],
    [0.75, 0.25],
    [0.5, 0.5],
  ]) {
    const screen = project(u, v),
      local = surfacePoint(corners, screen.x, screen.y);
    assert(Math.abs(local.x - u) < 1e-9);
    assert(Math.abs(local.y - v) < 1e-9);
  }
});
test("edge-on degenerate projection fails gracefully", () => {
  assert.equal(
    surfacePoint(
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 0, y: 100 },
      ],
      0,
      50,
    ),
    null,
  );
});
