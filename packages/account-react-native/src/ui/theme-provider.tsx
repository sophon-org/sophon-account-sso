import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

export type ThemeColorType = typeof COLORS.light | typeof COLORS.dark;

const ThemeContext = createContext<ThemeColorType | null>(null);

export function ThemeProvider({
  children,
  theme,
}: PropsWithChildren<{ theme?: 'light' | 'dark' }>) {
  const values = useMemo(() => {
    return COLORS[theme || 'light'];
  }, [theme]);

  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
}

export function useThemeColors() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeColors must be used within a ThemeProvider');
  }
  return context;
}

export function useThemedStyles<T>(
  stylesFn: (colors: typeof COLORS.light | typeof COLORS.dark) => T,
): T {
  const colors = useThemeColors();
  return useMemo(() => stylesFn(colors), [colors, stylesFn]);
}

const lightColors = {
  primary: {
    50: 'rgb(235, 244, 255)', // #EBF4FF - Light background
    100: 'rgb(204, 228, 255)', // #CCE4FF - Lighter blue
    200: 'rgb(66, 148, 240)', // #4294F0 - Medium blue
    300: 'rgb(10, 124, 255)', // #0A7CFF - Main primary blue
    400: 'rgb(5, 64, 133)', // #054085 - Darker blue
    500: 'rgb(3, 40, 82)', // #032852 - Deep blue
    600: 'rgb(23, 50, 82)', // #173252
    700: 'rgb(25, 43, 91)', // #192B5B
    800: 'rgb(20, 35, 75)', // #14234B
    900: 'rgb(15, 26, 56)', // #0F1A38
  },
  // Variações de azul usadas no projeto
  blue: {
    50: 'rgb(234, 241, 255)', // #EAF1FF - Secondary button background
    100: 'rgb(51, 119, 255)', // #3377FF - Icon colors
    200: 'rgb(0, 102, 255)', // #0066FF - Links
    300: 'rgb(10, 124, 255)', // #0A7CFF - Primary actions
  },
  info: {
    50: 'rgb(215, 239, 245)', // #D7EFF5
    100: 'rgb(150, 218, 235)', // #96DAEB
    200: 'rgb(86, 188, 214)', // #56BCD6
    300: 'rgb(65, 158, 184)', // #419EB8
    400: 'rgb(52, 128, 154)', // #34809A
    500: 'rgb(42, 102, 123)', // #2A667B
    600: 'rgb(37, 85, 102)', // #255566
    700: 'rgb(32, 68, 82)', // #204452
    800: 'rgb(26, 55, 66)', // #1A3742
    900: 'rgb(20, 42, 50)', // #142A32
  },
  success: {
    50: 'rgb(245, 252, 248)', // #F5FCF8
    100: 'rgb(220, 245, 230)', // #DCF5E6
    200: 'rgb(180, 230, 200)', // #B4E6C8
    300: 'rgb(114, 168, 140)', // #72A88C
    400: 'rgb(90, 145, 120)', // #5A9178
    500: 'rgb(70, 120, 95)', // #46785F
    600: 'rgb(55, 95, 75)', // #375F4B
    700: 'rgb(45, 75, 60)', // #2D4B3C
    800: 'rgb(35, 60, 48)', // #233C30
    900: 'rgb(25, 45, 35)', // #192D23
  },
  destructive: {
    50: 'rgb(255, 242, 246)', // #FFF2F6
    100: 'rgb(255, 220, 230)', // #FFDCE6
    200: 'rgb(255, 180, 200)', // #FFB4C8
    300: 'rgb(255, 113, 162)', // #FF71A2
    400: 'rgb(230, 100, 145)', // #E66491
    500: 'rgb(245, 33, 9)', // #F52109 - Error icons
    600: 'rgb(180, 95, 115)', // #B45F73
    700: 'rgb(150, 75, 95)', // #964B5F
    800: 'rgb(120, 60, 80)', // #783C50
    900: 'rgb(90, 45, 60)', // #5A2D3C
  },
  neutral: {
    50: 'rgb(250, 250, 250)', // #FAFAFA - Very light gray
    100: 'rgb(245, 245, 245)', // #571515ff - Card background
    200: 'rgb(235, 235, 235)', // #EBEBEB - Borders
    300: 'rgb(210, 210, 210)', // #D2D2D2 - Placeholders
    400: 'rgb(194, 194, 194)', // #C2C2C2
    500: 'rgb(141, 141, 141)', // #8D8D8D - Text muted
    600: 'rgb(115, 115, 115)', // #737373
    700: 'rgb(74, 74, 74)', // #4A4A4A
    800: 'rgb(42, 42, 42)', // #2A2A2A - Text primary
    900: 'rgb(20, 20, 20)', // #141414 - Dark
  },
  gray: {
    50: 'rgb(246, 247, 249)', // #F6F7F9 - Input background
    100: 'rgb(240, 240, 240)', // #F0F0F0 - Disabled states
    200: 'rgb(244, 244, 244)', // #F4F4F4 - Collapse background
    300: 'rgb(163, 162, 160)', // #A3A2A0 - Icons
    400: 'rgb(92, 88, 81)', // #5C5851 - Unchecked
    500: 'rgb(153, 153, 153)', // #999 - Disabled text
    600: 'rgb(204, 204, 204)', // #ccc - Indicators
    700: 'rgb(238, 238, 238)', // #EEE - Borders
  },
  // Semantic colors
  background: {
    primary: 'rgb(255, 255, 255)', // #FFFFFF
    secondary: 'rgb(245, 245, 245)', // #F5F5F5
    tertiary: 'rgb(246, 247, 249)', // #F6F7F9
    overlay: 'rgba(0, 0, 0, 0.5)', // Overlay backdrop
  },
  text: {
    primary: 'rgb(42, 42, 42)', // #2A2A2A
    secondary: 'rgb(141, 141, 141)', // #8D8D8D
    link: 'rgb(0, 102, 255)', // #0066FF
    disabled: 'rgb(210, 210, 210)', // #D2D2D2
    error: 'rgb(245, 33, 9)', // #F52109
  },
  border: {
    light: 'rgb(235, 235, 235)', // #EBEBEB
    medium: 'rgb(204, 204, 204)', // #ccc
    dark: 'rgb(141, 141, 141)', // #8D8D8D
    subtle: 'rgba(0, 0, 0, 0.05)', // Very subtle border
  },
  surface: 'rgb(255, 255, 255)', // #FFFFFF
  white: 'rgb(255, 255, 255)', // #FFFFFF
  black: 'rgb(0, 0, 0)', // #000000
  transparent: 'rgba(0, 0, 0, 0)', // Transparent
} as const;

const darkColors = {
  primary: {
    50: 'rgb(15, 26, 56)', // #0F1A38
    100: 'rgb(20, 35, 75)', // #14234B
    200: 'rgb(25, 43, 91)', // #192B5B
    300: 'rgb(23, 50, 82)', // #173252
    400: 'rgb(3, 40, 82)', // #032852
    500: 'rgb(5, 64, 133)', // #054085
    600: 'rgb(10, 124, 255)', // #0A7CFF
    700: 'rgb(66, 148, 240)', // #4294F0
    800: 'rgb(204, 228, 255)', // #CCE4FF
    900: 'rgb(235, 244, 255)', // #EBF4FF
  },
  blue: {
    50: 'rgb(23, 36, 61)', // Dark version of #EAF1FF
    100: 'rgb(51, 119, 255)', // #3377FF - Keep same
    200: 'rgb(0, 102, 255)', // #0066FF - Keep same
    300: 'rgb(66, 148, 240)', // #4294F0 - Lighter for dark mode
  },
  info: {
    50: 'rgb(20, 42, 50)', // #142A32
    100: 'rgb(26, 55, 66)', // #1A3742
    200: 'rgb(32, 68, 82)', // #204452
    300: 'rgb(37, 85, 102)', // #255566
    400: 'rgb(42, 102, 123)', // #2A667B
    500: 'rgb(52, 128, 154)', // #34809A
    600: 'rgb(65, 158, 184)', // #419EB8
    700: 'rgb(86, 188, 214)', // #56BCD6
    800: 'rgb(150, 218, 235)', // #96DAEB
    900: 'rgb(215, 239, 245)', // #D7EFF5
  },
  success: {
    50: 'rgb(25, 45, 35)', // #192D23
    100: 'rgb(35, 60, 48)', // #233C30
    200: 'rgb(45, 75, 60)', // #2D4B3C
    300: 'rgb(55, 95, 75)', // #375F4B
    400: 'rgb(70, 120, 95)', // #46785F
    500: 'rgb(90, 145, 120)', // #5A9178
    600: 'rgb(114, 168, 140)', // #72A88C
    700: 'rgb(180, 230, 200)', // #B4E6C8
    800: 'rgb(220, 245, 230)', // #DCF5E6
    900: 'rgb(245, 252, 248)', // #F5FCF8
  },
  destructive: {
    50: 'rgb(90, 45, 60)', // #5A2D3C
    100: 'rgb(120, 60, 80)', // #783C50
    200: 'rgb(150, 75, 95)', // #964B5F
    300: 'rgb(180, 95, 115)', // #B45F73
    400: 'rgb(204, 122, 139)', // #CC7A8B
    500: 'rgb(255, 100, 80)', // Lighter error for dark mode
    600: 'rgb(255, 113, 162)', // #FF71A2
    700: 'rgb(255, 180, 200)', // #FFB4C8
    800: 'rgb(255, 220, 230)', // #FFDCE6
    900: 'rgb(255, 242, 246)', // #FFF2F6
  },
  neutral: {
    50: 'rgb(20, 20, 20)', // #141414
    100: 'rgb(42, 42, 42)', // #2A2A2A
    200: 'rgb(74, 74, 74)', // #4A4A4A
    300: 'rgb(115, 115, 115)', // #737373
    400: 'rgb(141, 141, 141)', // #8D8D8D
    500: 'rgb(194, 194, 194)', // #C2C2C2
    600: 'rgb(210, 210, 210)', // #D2D2D2
    700: 'rgb(235, 235, 235)', // #EBEBEB
    800: 'rgb(245, 245, 245)', // #F5F5F5
    900: 'rgb(250, 250, 250)', // #FAFAFA
  },
  gray: {
    50: 'rgb(30, 32, 36)', // Dark version of #F6F7F9
    100: 'rgb(40, 40, 40)', // Dark version of #F0F0F0
    200: 'rgb(35, 35, 35)', // Dark version of #F4F4F4
    300: 'rgb(163, 162, 160)', // #A3A2A0 - Keep similar
    400: 'rgb(140, 138, 135)', // Lighter version for dark mode
    500: 'rgb(153, 153, 153)', // #999
    600: 'rgb(80, 80, 80)', // Dark version of #ccc
    700: 'rgb(60, 60, 60)', // Dark version of #EEE
  },
  background: {
    primary: 'rgb(20, 20, 20)', // #141414
    secondary: 'rgb(30, 30, 30)', // Darker gray
    tertiary: 'rgb(35, 35, 35)', // Slightly lighter
    overlay: 'rgba(0, 0, 0, 0.7)', // Darker overlay
  },
  text: {
    primary: 'rgb(245, 245, 245)', // #F5F5F5 - Light text
    secondary: 'rgb(194, 194, 194)', // #C2C2C2 - Muted light
    link: 'rgb(66, 148, 240)', // #4294F0 - Lighter blue for dark mode
    disabled: 'rgb(115, 115, 115)', // #737373 - Darker disabled
    error: 'rgb(255, 100, 80)', // Lighter error
  },
  border: {
    light: 'rgb(60, 60, 60)', // Dark borders
    medium: 'rgb(80, 80, 80)', // Medium dark
    dark: 'rgb(115, 115, 115)', // Lighter for contrast
    subtle: 'rgba(255, 255, 255, 0.1)', // Subtle white border
  },
  surface: 'rgb(20, 20, 20)', // #141414
  white: 'rgb(0, 0, 0)', // #000000 - Inverted
  black: 'rgb(255, 255, 255)', // #FFFFFF - Inverted
  transparent: 'rgba(0, 0, 0, 0)', // Transparent
} as const;

const COLORS = {
  white: 'rgb(255, 255, 255)', // #FFFFFF
  black: 'rgb(0, 0, 0)', // #000000
  light: lightColors,
  dark: darkColors,
} as const;
