import { useId, type ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { EGG_TYPES, evolutionStage, petType } from '../game';

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '');

export function PetArt({ typeId, size = 80, level = 1, mood = 'happy' }: { typeId: string; size?: number; level?: number; mood?: 'happy' | 'ok' | 'sad' }) {
  const uid = safeId(useId());
  const t = petType(typeId);
  // Draw on a fixed 100x100 canvas and scale
  const s = 100, cx = 50, cy = 50;
  const evol = evolutionStage(level);
  const scale = 0.8 + evol * 0.1;
  const bodyR = s * 0.3 * scale;
  const headR = s * 0.21 * scale;
  const eyeOpen = mood === 'sad' ? 2 : mood === 'ok' ? 3 : 4.2;
  const mouth = mood === 'happy'
    ? `M${cx - 8} ${cy + headR * 0.3} Q${cx} ${cy + headR * 0.75} ${cx + 8} ${cy + headR * 0.3}`
    : mood === 'sad'
      ? `M${cx - 8} ${cy + headR * 0.55} Q${cx} ${cy + headR * 0.1} ${cx + 8} ${cy + headR * 0.55}`
      : `M${cx - 6} ${cy + headR * 0.4} L${cx + 6} ${cy + headR * 0.4}`;

  let extras: ReactNode = null;
  switch (t.element) {
    case 'fire':
      extras = <G>
        <Ellipse cx={cx} cy={cy - bodyR - headR * 0.3} rx={headR * 0.6} ry={headR * 0.85} fill={t.accent} opacity={0.75} />
        <Ellipse cx={cx} cy={cy - bodyR - headR * 0.5} rx={headR * 0.35} ry={headR * 0.55} fill={t.baseColor} opacity={0.95} />
      </G>; break;
    case 'water':
      extras = <G>
        <Ellipse cx={cx - bodyR * 0.75} cy={cy + bodyR * 0.5} rx={bodyR * 0.25} ry={bodyR * 0.5} fill={t.baseColor} opacity={0.75} />
        <Ellipse cx={cx + bodyR * 0.75} cy={cy + bodyR * 0.5} rx={bodyR * 0.25} ry={bodyR * 0.5} fill={t.baseColor} opacity={0.75} />
      </G>; break;
    case 'nature':
      extras = <G>
        <Circle cx={cx - headR} cy={cy - bodyR * 0.85} r={headR * 0.5} fill={t.baseColor} />
        <Circle cx={cx + headR} cy={cy - bodyR * 0.95} r={headR * 0.45} fill={t.accent} />
        <Circle cx={cx} cy={cy - bodyR - headR * 0.35} r={headR * 0.42} fill={t.baseColor} />
      </G>; break;
    case 'shadow':
      extras = <G>
        <Ellipse cx={cx - bodyR} cy={cy - bodyR * 0.4} rx={bodyR * 0.3} ry={bodyR * 0.55} fill={t.baseColor} opacity={0.85} />
        <Ellipse cx={cx + bodyR} cy={cy - bodyR * 0.4} rx={bodyR * 0.3} ry={bodyR * 0.55} fill={t.baseColor} opacity={0.85} />
      </G>; break;
    case 'light':
    case 'cosmic':
      extras = <G>
        <Circle cx={cx} cy={cy} r={bodyR * 1.35} fill={t.accent} opacity={0.18} />
        <Circle cx={cx} cy={cy} r={bodyR * 1.65} fill={t.accent} opacity={0.08} />
      </G>; break;
    case 'ice':
      extras = <G>
        <Polygon points={`${cx},${cy - bodyR * 1.55} ${cx - 8},${cy - bodyR} ${cx + 8},${cy - bodyR}`} fill={t.accent} opacity={0.85} />
        <Polygon points={`${cx - bodyR * 0.8},${cy - bodyR * 0.3} ${cx - bodyR * 1.25},${cy + bodyR * 0.1} ${cx - bodyR * 0.4},${cy + bodyR * 0.1}`} fill={t.accent} opacity={0.7} />
        <Polygon points={`${cx + bodyR * 0.8},${cy - bodyR * 0.3} ${cx + bodyR * 1.25},${cy + bodyR * 0.1} ${cx + bodyR * 0.4},${cy + bodyR * 0.1}`} fill={t.accent} opacity={0.7} />
      </G>; break;
    case 'void':
      extras = <G>
        <Circle cx={cx} cy={cy} r={bodyR * 1.15} fill="none" stroke={t.accent} strokeWidth={1.2} opacity={0.45} />
        <Circle cx={cx} cy={cy} r={bodyR * 1.45} fill="none" stroke={t.accent} strokeWidth={0.7} opacity={0.25} />
      </G>; break;
    case 'earth':
      extras = <Ellipse cx={cx} cy={cy + bodyR * 1.05} rx={bodyR * 1.15} ry={bodyR * 0.35} fill={t.accent} opacity={0.4} />;
      break;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <RadialGradient id={`bg${uid}`} cx="50%" cy="50%">
          <Stop offset="0%" stopColor={t.baseColor} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={t.baseColor} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`body${uid}`} cx="35%" cy="30%">
          <Stop offset="0%" stopColor={t.accent} />
          <Stop offset="100%" stopColor={t.baseColor} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={s * 0.48} fill={`url(#bg${uid})`} />
      {extras}
      <Ellipse cx={cx} cy={cy + headR * 0.5} rx={bodyR} ry={bodyR * 0.85} fill={`url(#body${uid})`} />
      <Circle cx={cx} cy={cy - bodyR * 0.6} r={headR} fill={t.baseColor} />
      <Ellipse cx={cx - headR * 0.38} cy={cy - bodyR * 0.65} rx={headR * 0.2} ry={eyeOpen} fill="#2d3436" />
      <Ellipse cx={cx + headR * 0.38} cy={cy - bodyR * 0.65} rx={headR * 0.2} ry={eyeOpen} fill="#2d3436" />
      <Circle cx={cx - headR * 0.33} cy={cy - bodyR * 0.72} r={1.3} fill="#fff" />
      <Circle cx={cx + headR * 0.43} cy={cy - bodyR * 0.72} r={1.3} fill="#fff" />
      <Ellipse cx={cx} cy={cy - bodyR * 0.5} rx={2.5} ry={1.5} fill="#2d3436" opacity={0.6} />
      <Path d={mouth} stroke="#2d3436" strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.75} />
      <Circle cx={cx - headR * 0.6} cy={cy - bodyR * 0.45} r={headR * 0.17} fill="#ff8fab" opacity={0.55} />
      <Circle cx={cx + headR * 0.6} cy={cy - bodyR * 0.45} r={headR * 0.17} fill="#ff8fab" opacity={0.55} />
      <Ellipse cx={cx - bodyR * 0.45} cy={cy + bodyR * 0.92} rx={bodyR * 0.28} ry={bodyR * 0.2} fill={t.baseColor} />
      <Ellipse cx={cx + bodyR * 0.45} cy={cy + bodyR * 0.92} rx={bodyR * 0.28} ry={bodyR * 0.2} fill={t.baseColor} />
      {level >= 5 && <Circle cx={cx - bodyR * 1.05} cy={cy - bodyR} r={2.6} fill="#ffd700" />}
      {level >= 10 && <Circle cx={cx + bodyR * 1.05} cy={cy - bodyR} r={2.6} fill="#ffd700" />}
      {level >= 15 && <Circle cx={cx} cy={cy - bodyR * 1.45} r={3.2} fill="#ffd700" />}
    </Svg>
  );
}

export function EggArt({ eggId, size = 56, progress = 0 }: { eggId: string; size?: number; progress?: number }) {
  const uid = safeId(useId());
  const e = EGG_TYPES.find(x => x.id === eggId) ?? EGG_TYPES[0];
  const W = 56, H = 70, cx = 28, cy = 38;
  return (
    <Svg width={size} height={size * 1.25} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <RadialGradient id={`egg${uid}`} cx="35%" cy="30%">
          <Stop offset="0%" stopColor="#fff" stopOpacity={0.5} />
          <Stop offset="100%" stopColor={e.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={23} ry={29} fill={e.color} />
      <Ellipse cx={cx} cy={cy} rx={23} ry={29} fill={`url(#egg${uid})`} />
      <Circle cx={cx - 8} cy={cy - 10} r={4} fill={e.spots} opacity={0.55} />
      <Circle cx={cx + 10} cy={cy + 6} r={3} fill={e.spots} opacity={0.5} />
      <Circle cx={cx - 4} cy={cy + 13} r={2.6} fill={e.spots} opacity={0.5} />
      <Circle cx={cx + 5} cy={cy - 15} r={2} fill={e.accent} opacity={0.65} />
      <Ellipse cx={cx - 8} cy={cy - 13} rx={5} ry={3.5} fill="#fff" opacity={0.5} />
      {progress > 0.6 && <Path d={`M${cx - 2} ${cy - 15} L${cx + 4} ${cy - 6} L${cx - 3} ${cy + 3} L${cx + 2} ${cy + 12}`} stroke={e.accent} strokeWidth={2} fill="none" strokeLinecap="round" />}
      {progress > 0.3 && <Ellipse cx={cx} cy={cy} rx={23} ry={29} fill="none" stroke={e.accent} strokeWidth={2} opacity={0.3 + progress * 0.5} />}
    </Svg>
  );
}
