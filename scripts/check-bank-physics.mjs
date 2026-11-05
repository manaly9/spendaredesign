import assert from 'node:assert/strict'
import Matter from 'matter-js'
import { calibratedGravity, motionGravity, orientationGravity, screenGravity } from '../src/sections/BankTransfer/tiltGravity.js'

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`)
const down = motionGravity({ x: 0, y: 9.80665, z: 0 })
close(down.x, 0); close(down.y, 1)
close(motionGravity({ x: 0, y: -9.80665, z: 0 }).y, -1)
assert.equal(motionGravity({ x: 0, y: 0, z: 0 }), null)
assert.equal(motionGravity({ x: null, y: 9, z: 0 }), null)
close(orientationGravity(90, 0).y, 1)
close(orientationGravity(-90, 0).y, -1)
close(screenGravity(0, 1, 90).x, -1)
close(screenGravity(0, 1, 180).y, -1)
close(screenGravity(0, 1, 270).x, 1)
assert.deepEqual(calibratedGravity({ x: 0.02, y: 1 }), { x: 0, y: 1 })
assert.deepEqual(calibratedGravity({ x: 0, y: 0 }), { x: 0, y: 1 })
close(calibratedGravity({ x: 0.2, y: Math.sqrt(0.96) }, Math.atan2(0.2, Math.sqrt(0.96))).x, 0)
assert.ok(calibratedGravity({ x: 0.7, y: -0.7 }).y < 0, 'Inversion must not be calibrated away')

const { Bodies, Body, Composite, Engine, Sleeping } = Matter
const engine = Engine.create({ enableSleeping: true })
const body = Bodies.rectangle(100, 100, 50, 50, { frictionAir: 0.12 })
Composite.add(engine.world, body)
Sleeping.set(body, true)
for (let frame = 0; frame < 60; frame++) Engine.update(engine, 1000 / 60)
close(body.position.x, 100); close(body.position.y, 100)
Sleeping.set(body, false)
engine.gravity.x = 1; engine.gravity.y = 0
for (let frame = 0; frame < 10; frame++) Engine.update(engine, 1000 / 60)
assert.ok(body.position.x > 100)
Body.setPosition(body, { x: 100, y: 100 }); Body.setVelocity(body, { x: 0, y: 0 })
engine.gravity.x = 0; engine.gravity.y = -1
for (let frame = 0; frame < 10; frame++) Engine.update(engine, 1000 / 60)
assert.ok(body.position.y < 100)
Composite.clear(engine.world, false); Engine.clear(engine)
console.log('PASS: sensor axes, inversion, calibration, dead zone, sleeping handoff and Matter gravity.')
