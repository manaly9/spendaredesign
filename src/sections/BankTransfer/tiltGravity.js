const RAD = Math.PI / 180
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// Device axes are fixed to the phone; CSS axes follow the screen rotation.
export function screenGravity(x, y, screenAngle = 0) {
  const angle = screenAngle * RAD
  return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) }
}

export function motionGravity(acceleration, screenAngle = 0) {
  if (!acceleration || ![acceleration.x, acceleration.y, acceleration.z].every(Number.isFinite)) return null
  const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z)
  if (magnitude < 5 || magnitude > 15) return null // Reject missing readings and abrupt acceleration.
  // An accelerometer reports support force, opposite physical gravity. Device
  // +Y points upward, while screen +Y points downward.
  return screenGravity(-acceleration.x / 9.80665, acceleration.y / 9.80665, screenAngle)
}

export function orientationGravity(beta, gamma, screenAngle = 0) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return null
  return screenGravity(Math.cos(beta * RAD) * Math.sin(gamma * RAD), Math.sin(beta * RAD), screenAngle)
}

export function calibratedGravity(vector, neutralAngle = 0) {
  if (Math.hypot(vector.x, vector.y) < 0.12) return { x: 0, y: 1 }
  const x = vector.x * Math.cos(neutralAngle) - vector.y * Math.sin(neutralAngle)
  const y = vector.x * Math.sin(neutralAngle) + vector.y * Math.cos(neutralAngle)
  return { x: Math.abs(x) < 0.045 ? 0 : clamp(x, -1, 1), y: clamp(Math.abs(y - 1) < 0.05 ? 1 : y, -1, 1) }
}
