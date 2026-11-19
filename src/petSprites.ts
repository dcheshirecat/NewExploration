// Generated from the CC0 "Pixel Adventure 2" pack by Pixel Frog (pixelfrog-assets.itch.io).
// Sheets are pre-scaled 8x with nearest-neighbour so they stay crisp. Frame sizes below are in original pixels.
export type SpriteSheet = { src: number; frames: number; cols: number; w: number; h: number };
export type CreatureSprites = { idle: SpriteSheet; act?: SpriteSheet };
export const SPRITE_SCALE = 8;

export const SPRITES: Record<string, CreatureSprites> = {
  chicken: { idle: { src: require('../assets/pets/chicken_idle.png'), frames: 13, cols: 8, w: 32, h: 34 }, act: { src: require('../assets/pets/chicken_act.png'), frames: 14, cols: 8, w: 32, h: 34 } },
  duck: { idle: { src: require('../assets/pets/duck_idle.png'), frames: 10, cols: 7, w: 34, h: 32 } },
  bunny: { idle: { src: require('../assets/pets/bunny_idle.png'), frames: 8, cols: 8, w: 32, h: 43 }, act: { src: require('../assets/pets/bunny_act.png'), frames: 12, cols: 8, w: 32, h: 43 } },
  snail: { idle: { src: require('../assets/pets/snail_idle.png'), frames: 15, cols: 8, w: 32, h: 23 } },
  mushroom: { idle: { src: require('../assets/pets/mushroom_idle.png'), frames: 14, cols: 9, w: 28, h: 21 }, act: { src: require('../assets/pets/mushroom_act.png'), frames: 16, cols: 9, w: 28, h: 21 } },
  radish: { idle: { src: require('../assets/pets/radish_idle.png'), frames: 9, cols: 8, w: 30, h: 37 }, act: { src: require('../assets/pets/radish_act.png'), frames: 12, cols: 8, w: 30, h: 37 } },
  slime: { idle: { src: require('../assets/pets/slime_idle.png'), frames: 10, cols: 6, w: 42, h: 30 } },
  turtle: { idle: { src: require('../assets/pets/turtle_idle.png'), frames: 14, cols: 7, w: 33, h: 21 } },
  bee: { idle: { src: require('../assets/pets/bee_idle.png'), frames: 6, cols: 6, w: 34, h: 31 } },
  bluebird: { idle: { src: require('../assets/pets/bluebird_idle.png'), frames: 9, cols: 8, w: 32, h: 28 } },
  angrypig: { idle: { src: require('../assets/pets/angrypig_idle.png'), frames: 9, cols: 7, w: 33, h: 29 }, act: { src: require('../assets/pets/angrypig_act.png'), frames: 12, cols: 7, w: 33, h: 29 } },
  ghost: { idle: { src: require('../assets/pets/ghost_idle.png'), frames: 10, cols: 8, w: 31, h: 30 } },
  bat: { idle: { src: require('../assets/pets/bat_idle.png'), frames: 7, cols: 5, w: 46, h: 26 } },
  fatbird: { idle: { src: require('../assets/pets/fatbird_idle.png'), frames: 8, cols: 6, w: 37, h: 45 } },
  chameleon: { idle: { src: require('../assets/pets/chameleon_idle.png'), frames: 13, cols: 7, w: 35, h: 36 }, act: { src: require('../assets/pets/chameleon_act.png'), frames: 8, cols: 7, w: 35, h: 36 } },
  rino: { idle: { src: require('../assets/pets/rino_idle.png'), frames: 11, cols: 5, w: 51, h: 30 }, act: { src: require('../assets/pets/rino_act.png'), frames: 6, cols: 5, w: 51, h: 30 } },
};
