const images = import.meta.glob('../../../bank_icons/*.png', { eager: true, query: '?url', import: 'default' })

// Positions describe the full transparent PNG canvases, not cropped logos.
// Native artwork already contains most of the reference's tilt and lighting.
export const BANK_TILES = [
  { id: 'uba', name: 'UBA', asset: 5, x: 10, bottom: -4, size: 20.4, angle: 90, z: 1, mobileX: 15, mobileBottom: 27 },
  { id: 'first', name: 'FirstBank', asset: 1, x: 87, bottom: -3, size: 22, angle: 18, z: 2, mobileX: 86, mobileBottom: 0 },
  { id: 'fidelity', name: 'Fidelity Bank', asset: 2, x: 21, bottom: -4, size: 20, angle: 16, z: 3, mobileX: 15, mobileBottom: 0 },
  { id: 'opay', name: 'OPay', asset: 6, x: 29.5, bottom: 12, size: 20.5, angle: 0, z: 2, mobileX: 20, mobileBottom: 52 },
  { id: 'wema', name: 'Wema Bank', asset: 3, x: 61.5, bottom: 26, size: 20, angle: 3, z: 2, mobileX: 80, mobileBottom: 52 },
  { id: 'sterling', name: 'Sterling Bank', asset: 4, x: 50.5, bottom: -8, size: 21.5, angle: 0, z: 4, mobileX: 46, mobileBottom: 27 },
  { id: 'gtbank', name: 'GTBank', asset: 10, x: 77, bottom: -2, size: 22, angle: 58, z: 5, mobileX: 78, mobileBottom: 27 },
  { id: 'kuda', name: 'Kuda', asset: 7, x: 45, bottom: 26, size: 21, angle: 2, z: 6, mobileX: 50, mobileBottom: 53 },
  { id: 'access', name: 'Access Bank', asset: 8, x: 34.5, bottom: -4, size: 23, angle: 4, z: 7, mobileX: 39, mobileBottom: 0 },
  { id: 'union', name: 'Union Bank', asset: 9, x: 64, bottom: -6, size: 24, angle: 0, z: 8, mobileX: 64, mobileBottom: 0 },
].map(tile => ({ ...tile, src: images[`../../../bank_icons/bank_icons (${tile.asset}).png`] }))
