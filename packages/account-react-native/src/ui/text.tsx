import type React from 'react';
import { useMemo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
  type TextStyle,
} from 'react-native';

type TextVariant = 'small' | 'normal' | 'large';

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
] as const;

export const Text: React.FC<Props> = ({ size = 'normal', style, ...rest }) => {
  const inlineStyle = useMemo(() => {
    const s: TextStyle = {};
    TEXT_STYLE_KEYS.forEach((k) => {
      const v = rest[k];
      // biome-ignore lint/suspicious/noExplicitAny: review this type
      if (v !== undefined) s[k] = v as any;
    });
    return s;
  }, [rest]);

  const passThroughProps = useMemo(() => {
    const clone: Record<string, unknown> = { ...rest };
    TEXT_STYLE_KEYS.forEach((k) => delete clone[k]);
    return clone as RNTextProps;
  }, [rest]);

  return (
    <RNText
      {...passThroughProps}
      style={[styles.base, styles[size], inlineStyle, style]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    color: '#2A2A2A',
  },
  small: {
    fontSize: 10,
    lineHeight: 10 * 1.33,
  },
  normal: {
    fontSize: 15,
    lineHeight: 20 * 1.33,
  },
  large: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
  },
});
