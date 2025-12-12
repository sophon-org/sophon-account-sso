import type React from 'react';
import { useMemo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { type ThemeColorType, useThemedStyles } from './theme-provider';

type TextVariant = 'small' | 'caption' | 'regular' | 'large';

type TextStylePropKeys =
  | 'color'
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  | 'textAlign'
  | 'textDecorationLine'
  | 'textDecorationStyle'
  | 'textDecorationColor'
  | 'textTransform'
  | 'includeFontPadding'
  | 'textAlignVertical'
  | 'fontVariant'
  | 'textShadowColor'
  | 'textShadowOffset'
  | 'textShadowRadius'
  | 'writingDirection'
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'overflow'
  | 'flexWrap'
  | 'paddingLeft';

type InlineTextStyleProps = Partial<Pick<TextStyle, TextStylePropKeys>>;

type Props = RNTextProps &
  InlineTextStyleProps & {
    size?: TextVariant;
  };

const TEXT_STYLE_KEYS: ReadonlyArray<TextStylePropKeys> = [
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecorationLine',
  'textDecorationStyle',
  'textDecorationColor',
  'textTransform',
  'includeFontPadding',
  'textAlignVertical',
  'fontVariant',
  'textShadowColor',
  'textShadowOffset',
  'textShadowRadius',
  'writingDirection',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'overflow',
  'flexWrap',
] as const;

export const Text: React.FC<Props> = ({ size = 'regular', style, ...rest }) => {
  const styles = useThemedStyles(createStyles);
  const inlineStyle = useMemo(() => {
    const textStyles: TextStyle = {};
    TEXT_STYLE_KEYS.forEach((key) => {
      const value = rest[key];
      // biome-ignore lint/suspicious/noExplicitAny: TODO @cleo to review this
      if (value !== undefined) (textStyles as any)[key] = value;
    });
    return textStyles;
    // biome-ignore lint/correctness/useExhaustiveDependencies: biome is not smart enough to know that rest should not be a dependency
  }, [rest]);

  const passThroughProps = useMemo(() => {
    const clone: Record<string, unknown> = { ...rest };
    TEXT_STYLE_KEYS.forEach((k) => delete clone[k]);
    return clone as RNTextProps;
    // biome-ignore lint/correctness/useExhaustiveDependencies: biome is not smart enough to know that rest should not be a dependency
  }, [rest]);

  return (
    <RNText
      {...passThroughProps}
      style={[styles.base, styles[size], inlineStyle, style]}
    />
  );
};

const createStyles = (colors: ThemeColorType) =>
  StyleSheet.create({
    base: {
      color: colors.text.primary,
    },
    small: {
      fontSize: 10,
      lineHeight: 10 * 1.33,
    },
    caption: {
      fontSize: 12,
      lineHeight: 12 * 1.33,
    },
    regular: {
      fontSize: 15,
      lineHeight: 15 * 1.33,
    },
    large: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: 'bold',
    },
  });
