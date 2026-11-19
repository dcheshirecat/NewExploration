// Pastel rainbow theme. Every section of the app has its own pastel colour;
// the active section's colours are merged into the theme (see makeTheme).

export type SectionKey = 'home' | 'budget' | 'insights' | 'goals' | 'pets' | 'settings';

/** accent = pastel fill (buttons, hero) · ink = text on accent · strong = saturated (highlights, progress) · soft = tinted inputs/chips · bg = page background */
export type Section = { accent: string; ink: string; strong: string; soft: string; bg: string };

export const PIXEL_FONT = 'PixelifySans_700Bold';

const LIGHT_SECTIONS: Record<SectionKey, Section> = {
  home:     { accent: '#ffcfb3', ink: '#6b2e10', strong: '#e2683a', soft: '#fff1e8', bg: '#fff8f3' },
  budget:   { accent: '#b8edd2', ink: '#0f5132', strong: '#1f9e67', soft: '#e9f9f0', bg: '#f4fcf8' },
  insights: { accent: '#c3dfff', ink: '#12406e', strong: '#2f7de1', soft: '#eaf3ff', bg: '#f5f9ff' },
  goals:    { accent: '#dccdff', ink: '#3e2780', strong: '#7a5ae6', soft: '#f1ecff', bg: '#f9f6ff' },
  pets:     { accent: '#ffe8a3', ink: '#5c4300', strong: '#b57f00', soft: '#fff7dc', bg: '#fffcf0' },
  settings: { accent: '#ffcbdd', ink: '#6e1840', strong: '#d93d78', soft: '#ffeef4', bg: '#fff7fa' },
};

const DARK_SECTIONS: Record<SectionKey, Section> = {
  home:     { accent: '#ffcfb3', ink: '#4a1d08', strong: '#ff9a72', soft: '#33251f', bg: '#18131a' },
  budget:   { accent: '#b8edd2', ink: '#0b3d25', strong: '#5fd8a0', soft: '#1f2f2a', bg: '#121716' },
  insights: { accent: '#c3dfff', ink: '#0d2f52', strong: '#7cb4ff', soft: '#1f2a3a', bg: '#121520' },
  goals:    { accent: '#dccdff', ink: '#2c1b63', strong: '#ad97ff', soft: '#2a2440', bg: '#15121f' },
  pets:     { accent: '#ffe8a3', ink: '#423000', strong: '#ffcf4d', soft: '#332c18', bg: '#17150f' },
  settings: { accent: '#ffcbdd', ink: '#4f0f2c', strong: '#ff86b4', soft: '#352030', bg: '#18121a' },
};

export type Theme = {
  dark: boolean;
  section: SectionKey;
  sections: Record<SectionKey, Section>;
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textSoft: string;
  textFaint: string;
  /** saturated colour of the current section */
  primary: string;
  /** pastel button colour + its text colour */
  btn: string;
  btnText: string;
  accent: string;
  gold: string;
  goldText: string;
  good: string;
  goodBg: string;
  bad: string;
  badBg: string;
  warn: string;
  warnBg: string;
  info: string;
  infoBg: string;
  input: string;
  chip: string;
  chipText: string;
  tabBar: string;
  jarGlass: string;
  jarFill: string;
  statPink: string;
  statGreen: string;
  statYellow: string;
  statPurple: string;
  statBlue: string;
  statPeach: string;
  statText: string;
  chartReg: string;
  chartFun: string;
  chartIncome: string;
  grid: string;
};

type Base = Omit<Theme, 'section' | 'primary' | 'btn' | 'btnText' | 'input' | 'chip' | 'chipText' | 'bg' | 'cardAlt'> & { cardAltBase: string };

const lightBase: Base = {
  dark: false,
  sections: LIGHT_SECTIONS,
  card: '#ffffff',
  cardAltBase: '#faf8fc',
  border: '#eee8f4',
  text: '#2a2140',
  textSoft: '#6b6380',
  textFaint: '#a39cb5',
  accent: '#ff7aa8',
  gold: '#ffe08a',
  goldText: '#5c4300',
  good: '#1f8a55',
  goodBg: '#e3f8ec',
  bad: '#d23f6f',
  badBg: '#ffe6ee',
  warn: '#8a5a00',
  warnBg: '#fff2cc',
  info: '#1f62b8',
  infoBg: '#e6f1ff',
  tabBar: '#ffffff',
  jarGlass: 'rgba(160,140,220,0.07)',
  jarFill: '#8fe3b5',
  statPink: '#ffd9e5',
  statGreen: '#cdf3df',
  statYellow: '#fff0b8',
  statPurple: '#e5dcff',
  statBlue: '#d3e8ff',
  statPeach: '#ffe0cf',
  statText: '#2a2140',
  chartReg: '#2a78d6',
  chartFun: '#eb6834',
  chartIncome: '#1baf7a',
  grid: '#eeeaf4',
};

const darkBase: Base = {
  dark: true,
  sections: DARK_SECTIONS,
  card: '#221e2d',
  cardAltBase: '#2b2638',
  border: '#363047',
  text: '#f4f0fb',
  textSoft: '#bdb5cf',
  textFaint: '#857d99',
  accent: '#ff8fb8',
  gold: '#ffe08a',
  goldText: '#423000',
  good: '#5fd8a0',
  goodBg: 'rgba(95,216,160,0.13)',
  bad: '#ff86a8',
  badBg: 'rgba(255,134,168,0.13)',
  warn: '#ffd166',
  warnBg: 'rgba(255,209,102,0.13)',
  info: '#7cb4ff',
  infoBg: 'rgba(124,180,255,0.13)',
  tabBar: '#1c1926',
  jarGlass: 'rgba(200,220,255,0.06)',
  jarFill: '#5fd8a0',
  statPink: '#4a2638',
  statGreen: '#1e4034',
  statYellow: '#463b1a',
  statPurple: '#352b5a',
  statBlue: '#1f3352',
  statPeach: '#4a2f22',
  statText: '#f4f0fb',
  chartReg: '#3987e5',
  chartFun: '#d95926',
  chartIncome: '#199e70',
  grid: '#332d42',
};

export function makeTheme(dark: boolean, section: SectionKey): Theme {
  const b = dark ? darkBase : lightBase;
  const s = b.sections[section];
  const { cardAltBase, ...rest } = b;
  return {
    ...rest,
    section,
    bg: s.bg,
    cardAlt: dark ? cardAltBase : s.soft,
    primary: s.strong,
    btn: s.accent,
    btnText: s.ink,
    input: dark ? cardAltBase : s.soft,
    chip: dark ? cardAltBase : s.soft,
    chipText: dark ? '#e6def5' : s.ink,
  };
}

export const lightTheme = makeTheme(false, 'home');
export const darkTheme = makeTheme(true, 'home');
