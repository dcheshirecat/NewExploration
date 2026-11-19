import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { evolutionStage } from '../game';
import { SPRITES, type SpriteSheet } from '../petSprites';

type Props = {
  typeId: string;
  /** box size in dp; the creature is fitted inside it */
  size?: number;
  level?: number;
  mood?: 'happy' | 'ok' | 'sad';
  /** change this number to make the pet do a happy reaction */
  reactKey?: number;
  /** walk animation instead of idle (when the pet has one) */
  moving?: boolean;
};

/** Animated pixel creature drawn from a sprite sheet. */
export function PetArt({ typeId, size = 80, level = 1, mood = 'happy', reactKey = 0, moving = false }: Props) {
  const sprites = SPRITES[typeId] ?? SPRITES.chicken;
  const [frame, setFrame] = useState(0);
  const [acting, setActing] = useState(false);
  const hop = useRef(new Animated.Value(0)).current;
  const sheet: SpriteSheet = (acting || moving) && sprites.act ? sprites.act : sprites.idle;

  // frame clock: 20 fps normally (the pack's speed), slower when the pet is sad
  useEffect(() => {
    const ms = mood === 'sad' ? 120 : mood === 'ok' ? 70 : 50;
    const id = setInterval(() => setFrame(f => f + 1), ms);
    return () => clearInterval(id);
  }, [mood]);

  // happy reaction: hop + play the action animation once
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setActing(true);
    setFrame(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0.5, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setActing(false), 900);
    return () => clearTimeout(t);
  }, [reactKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // fit the creature in the box; grow a little with each evolution stage
  const stage = evolutionStage(level);
  const grow = 0.78 + stage * 0.07;
  const maxW = Math.max(sprites.idle.w, sprites.act?.w ?? 0);
  const maxH = Math.max(sprites.idle.h, sprites.act?.h ?? 0);
  const k = (size * grow) / Math.max(maxW, maxH); // dp per original pixel
  const i = frame % sheet.frames;
  const col = i % sheet.cols, row = Math.floor(i / sheet.cols);
  const rows = Math.ceil(sheet.frames / sheet.cols);
  const w = sheet.w * k, h = sheet.h * k;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* soft shadow */}
      <View style={{ position: 'absolute', bottom: size * 0.02, width: w * 0.7, height: Math.max(4, size * 0.06), borderRadius: 999, backgroundColor: 'rgba(40,20,80,0.12)' }} />
      <Animated.View style={{ marginBottom: size * 0.04, transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.22] }) }] }}>
        <View style={{ width: w, height: h, overflow: 'hidden', opacity: mood === 'sad' ? 0.75 : 1 }}>
          <Image
            source={sheet.src}
            fadeDuration={0}
            style={{ position: 'absolute', width: sheet.cols * sheet.w * k, height: rows * sheet.h * k, left: -col * w, top: -row * h }}
            resizeMode="stretch"
          />
        </View>
      </Animated.View>
      {stage >= 2 && <Text style={{ position: 'absolute', top: 0, right: size * 0.08, fontSize: size * 0.14 }}>{stage === 3 ? '👑' : '⭐'}</Text>}
      {mood === 'sad' && <Text style={{ position: 'absolute', top: 0, left: size * 0.08, fontSize: size * 0.16 }}>💧</Text>}
    </View>
  );
}
