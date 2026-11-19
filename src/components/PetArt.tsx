import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { EGG_TYPES } from '../game';

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '');

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
