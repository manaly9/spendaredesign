import Matter from 'matter-js'
import { calibratedGravity, clamp, motionGravity, orientationGravity } from './tiltGravity.js'

const { Bodies, Body, Composite, Engine, Sleeping, Events } = Matter
const STEP = 1000 / 60

export function createBankPhysics(section, onTiltStatus, permissionState) {
  const pile = section.querySelector('.bank-pile')
  const slots = [...pile.querySelectorAll('.bank-tile-slot')]
  const layers = slots.map(slot => slot.querySelector('.bank-tile-physics'))
  const engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 8 })
  engine.gravity.scale = 0.00013
  let bodies = [], homes = [], limits = [], frame = 0, last = 0, accumulator = 0
  let started = false, visible = false, destroyed = false, collisionCount = 0
  let width = 0, height = 0, resetProgress = null, resetFrom = [], resizeTimer
  let pointer = null, lastPointer = null, targetGravity = { x: 0, y: 1 }, gravity = { x: 0, y: 1 }
  let sensorRemovers = [], sensorTimer, lastMotion = -Infinity, neutralAngle = null
  const sensorState = { active: false }
  const angle = () => screen.orientation?.angle ?? window.orientation ?? 0
  const allowed = () => started && visible && !document.hidden && !destroyed

  const render = () => bodies.forEach((body, index) => {
    const home = homes[index]
    layers[index].style.transform = `translate(${body.position.x - home.x}px, ${body.position.y - home.y}px) rotate(${body.angle}rad)`
  })

  function build() {
    Composite.clear(engine.world, false)
    Engine.clear(engine)
    width = pile.clientWidth
    height = pile.clientHeight
    homes = slots.map(slot => ({ x: slot.offsetLeft, y: slot.offsetTop + slot.offsetHeight / 2, size: slot.offsetWidth }))
    bodies = homes.map((home, index) => {
      const distance = Math.min(...homes.filter((_, i) => i !== index).map(other => Math.hypot(other.x - home.x, other.y - home.y)))
      // The reference intentionally overlaps artwork in depth. Conservative,
      // non-overlapping contact proxies preserve that layering at handoff.
      const size = Math.min(home.size * 0.55, distance * 0.7)
      const body = Bodies.rectangle(home.x, home.y, size, size, {
        label: slots[index].dataset.bank, chamfer: { radius: size * 0.15 },
        friction: 0.8, frictionStatic: 1.2, frictionAir: 0.12, restitution: 0.12,
        density: 0.003, sleepThreshold: 45,
      })
      Sleeping.set(body, true)
      return body
    })
    limits = homes.map(home => ({
      left: Math.min(home.x, home.size * 0.37), right: Math.max(home.x, width - home.size * 0.37),
      top: Math.min(home.y, home.size * 0.4), bottom: Math.max(home.y, height - home.size * 0.38),
    }))
    const wall = { isStatic: true, friction: 0.9, restitution: 0.05 }
    Composite.add(engine.world, [...bodies,
      Bodies.rectangle(width / 2, -50, width + 200, 100, wall),
      Bodies.rectangle(width / 2, height + 50, width + 200, 100, wall),
      Bodies.rectangle(-50, height / 2, 100, height + 200, wall),
      Bodies.rectangle(width + 50, height / 2, 100, height + 200, wall),
    ])
    resetProgress = null
    render()
  }

  const wake = body => Sleeping.set(body, false)
  function keepInside() {
    bodies.forEach((body, index) => {
      // A second visual bound accounts for transparent PNG margins and rotation.
      const limit = limits[index]
      const x = clamp(body.position.x, limit.left, limit.right)
      const y = clamp(body.position.y, limit.top, limit.bottom)
      if (x !== body.position.x || y !== body.position.y) {
        const hitX = x !== body.position.x
        Body.setPosition(body, { x, y })
        Body.setVelocity(body, { x: hitX ? 0 : body.velocity.x * 0.5, y: body.velocity.y * 0.25 })
      }
      if (body.speed > 2.6) Body.setVelocity(body, { x: body.velocity.x * 2.6 / body.speed, y: body.velocity.y * 2.6 / body.speed })
      if (Math.abs(body.angularVelocity) > 0.018) Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * 0.018)
    })
  }

  function tick(now) {
    frame = 0
    if (!allowed()) return
    const elapsed = last ? Math.min(now - last, 50) : STEP
    last = now
    accumulator += elapsed
    if (resetProgress !== null) {
      resetProgress = Math.min(1, resetProgress + elapsed / 1000)
      const ease = 1 - (1 - resetProgress) ** 3
      bodies.forEach((body, index) => {
        const start = resetFrom[index], home = homes[index]
        Body.setPosition(body, { x: start.x + (home.x - start.x) * ease, y: start.y + (home.y - start.y) * ease })
        Body.setAngle(body, start.angle * (1 - ease))
        Body.setVelocity(body, { x: 0, y: 0 })
        Body.setAngularVelocity(body, 0)
      })
      if (resetProgress === 1) {
        bodies.forEach(body => { body.collisionFilter.mask = 0xFFFFFFFF; Sleeping.set(body, true) })
        resetProgress = null
      }
      accumulator = 0
    } else {
      gravity.x += (targetGravity.x - gravity.x) * 0.1
      gravity.y += (targetGravity.y - gravity.y) * 0.1
      engine.gravity.x = gravity.x * 0.75
      engine.gravity.y = gravity.y
      while (accumulator >= STEP) {
        if (pointer && now - pointer.time < 120) {
          bodies.forEach((body, index) => {
            const distance = Math.hypot(body.position.x - pointer.x, body.position.y - pointer.y)
            const radius = homes[index].size * 0.8
            if (distance < radius) {
              const influence = 1 - distance / radius
              wake(body)
              Body.applyForce(body, { x: pointer.x, y: clamp(pointer.y, body.position.y - 15, body.position.y + 15) }, {
                x: body.mass * clamp(pointer.dx, -12, 12) * 0.000016 * influence,
                y: -body.mass * 0.000045 * influence,
              })
            }
          })
        }
        Engine.update(engine, STEP)
        keepInside()
        accumulator -= STEP
      }
    }
    render()
    frame = requestAnimationFrame(tick)
  }

  function sync() {
    if (allowed()) {
      section.dataset.physicsRunning = 'true'
      if (!frame) { last = 0; accumulator = 0; frame = requestAnimationFrame(tick) }
    } else {
      cancelAnimationFrame(frame)
      frame = 0
      pointer = lastPointer = null
      section.dataset.physicsRunning = 'false'
    }
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync() }, { threshold: 0 })
  observer.observe(pile)
  document.addEventListener('visibilitychange', sync)
  const collisions = event => { collisionCount += event.pairs.length }
  Events.on(engine, 'collisionStart', collisions)

  const point = event => {
    const rect = pile.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }
  const move = event => {
    if (!allowed() || resetProgress !== null || event.pointerType === 'touch') return
    const position = point(event)
    const previous = lastPointer ?? { x: width / 2, y: position.y }
    pointer = { ...position, dx: clamp(position.x - previous.x, -12, 12), time: performance.now() }
    lastPointer = position
  }
  const leave = () => { pointer = lastPointer = null }
  const tap = event => {
    if (!allowed() || resetProgress !== null || event.pointerType === 'mouse') return
    const position = point(event)
    pointer = { ...position, dx: position.x < width / 2 ? -7 : 7, time: performance.now() }
  }
  pile.addEventListener('pointermove', move)
  pile.addEventListener('pointerleave', leave)
  pile.addEventListener('pointerdown', tap)
  const focus = event => {
    const index = slots.findIndex(slot => slot.contains(event.target))
    if (index >= 0 && allowed()) pointer = { ...bodies[index].position, dx: index % 2 ? 5 : -5, time: performance.now() }
  }
  pile.addEventListener('focusin', focus)

  const receiveGravity = (vector, source) => {
    if (!vector || !allowed() || resetProgress !== null) return
    if (neutralAngle === null) neutralAngle = vector.y > 0.5 && Math.abs(vector.x) < 0.25 ? Math.atan2(vector.x, vector.y) : 0
    targetGravity = calibratedGravity(vector, neutralAngle)
    if (Math.abs(targetGravity.x) > 0.045 || targetGravity.y < 0.8) bodies.forEach(wake)
    if (!sensorState.active) {
      sensorState.active = true
      clearTimeout(sensorTimer)
      onTiltStatus('active')
    }
    section.dataset.gravitySource = source
  }
  const motion = event => {
    const vector = motionGravity(event.accelerationIncludingGravity, angle())
    if (vector) { lastMotion = performance.now(); receiveGravity(vector, 'motion') }
  }
  const orientation = event => {
    if (performance.now() - lastMotion > 800) receiveGravity(orientationGravity(event.beta, event.gamma, angle()), 'orientation')
  }
  const stopSensors = () => { sensorRemovers.forEach(remove => remove()); sensorRemovers = []; clearTimeout(sensorTimer) }
  const subscribeSensors = () => {
    if (permissionState.grants[0]) { window.addEventListener('devicemotion', motion); sensorRemovers.push(() => window.removeEventListener('devicemotion', motion)) }
    if (permissionState.grants[1]) { window.addEventListener('deviceorientation', orientation); sensorRemovers.push(() => window.removeEventListener('deviceorientation', orientation)) }
    sensorTimer = setTimeout(() => {
      if (!sensorState.active && !destroyed) { stopSensors(); onTiltStatus('unavailable') }
    }, 4000)
  }

  const resize = new ResizeObserver(() => {
    if (!started || (width === pile.clientWidth && height === pile.clientHeight)) return
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { if (!destroyed) { build(); sync() } }, 100)
  })
  resize.observe(pile)

  const reset = () => {
    if (!started || destroyed) return
    pointer = lastPointer = null
    targetGravity = gravity = { x: 0, y: 1 }
    neutralAngle = null
    resetFrom = bodies.map(body => ({ ...body.position, angle: body.angle }))
    bodies.forEach(body => { body.collisionFilter.mask = 0; wake(body) })
    resetProgress = 0
    sync()
  }

  // Development-only sensor simulator: never shipped in the production bundle.
  if (import.meta.env.DEV) section.__bankPhysicsTest = {
    setGravity(x, y) { targetGravity = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) }; bodies.forEach(wake); sync() },
    snapshot: () => ({ running: allowed(), collisions: collisionCount, gravity: { ...engine.gravity },
      bodies: bodies.map((body, i) => ({ ...body.position, angle: body.angle, home: homes[i], sleeping: body.isSleeping, limit: limits[i] })) }),
    reset,
  }

  return {
    start() {
      if (started || destroyed) return
      started = true
      build()
      section.dataset.physicsReady = 'true'
      if (permissionState.grants.some(Boolean)) subscribeSensors()
      sync()
    },
    reset,
    async enableTilt() {
      if (permissionState.asked || destroyed) return
      permissionState.asked = true
      if (!window.isSecureContext || (!window.DeviceMotionEvent && !window.DeviceOrientationEvent)) { onTiltStatus('unavailable'); return }
      onTiltStatus('requesting')
      // Both permission requests are invoked synchronously inside the click gesture.
      const types = [window.DeviceMotionEvent, window.DeviceOrientationEvent]
      const results = await Promise.allSettled(types.map(type => {
        try { return !type ? Promise.resolve('unavailable') : typeof type.requestPermission === 'function' ? type.requestPermission() : Promise.resolve('granted') }
        catch (error) { return Promise.reject(error) }
      }))
      if (destroyed) return
      const granted = results.map(result => result.status === 'fulfilled' && result.value === 'granted')
      permissionState.grants = granted
      if (!granted.some(Boolean)) { onTiltStatus('denied'); return }
      subscribeSensors()
    },
    destroy() {
      destroyed = true
      cancelAnimationFrame(frame)
      clearTimeout(resizeTimer)
      observer.disconnect()
      resize.disconnect()
      stopSensors()
      document.removeEventListener('visibilitychange', sync)
      pile.removeEventListener('pointermove', move)
      pile.removeEventListener('pointerleave', leave)
      pile.removeEventListener('pointerdown', tap)
      pile.removeEventListener('focusin', focus)
      Events.off(engine, 'collisionStart', collisions)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
      layers.forEach(layer => layer.style.removeProperty('transform'))
      delete section.__bankPhysicsTest
      section.dataset.physicsReady = section.dataset.physicsRunning = 'false'
    },
  }
}
