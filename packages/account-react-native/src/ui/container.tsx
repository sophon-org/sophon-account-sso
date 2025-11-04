import type React from 'react';
import { useMemo } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

type ViewStylePropKeys =
  | 'flex'
  | 'flexDirection'
  | 'flexWrap'
  | 'flexGrow'
  | 'flexShrink'
  | 'flexBasis'
  | 'alignItems'
  | 'alignContent'
  | 'alignSelf'
  | 'justifyContent'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginHorizontal'
  | 'marginVertical'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingHorizontal'
  | 'paddingVertical'
  | 'backgroundColor'
  | 'borderWidth'
  | 'borderTopWidth'
  | 'borderRightWidth'
  | 'borderBottomWidth'
  | 'borderLeftWidth'
  | 'borderColor'
  | 'borderTopColor'
  | 'borderRightColor'
  | 'borderBottomColor'
  | 'borderLeftColor'
  | 'borderRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius'
  | 'borderStyle'
  | 'opacity'
  | 'overflow'
  | 'position'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'zIndex'
  | 'gap'
  | 'rowGap'
  | 'columnGap';

type InlineViewStyleProps = Partial<Pick<ViewStyle, ViewStylePropKeys>>;

export type ContainerProps = ViewProps &
  InlineViewStyleProps & {
    isVisible?: boolean;
  };

const VIEW_STYLE_KEYS: ReadonlyArray<ViewStylePropKeys> = [
  'flex',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'alignContent',
  'alignSelf',
  'justifyContent',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'backgroundColor',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderStyle',
  'opacity',
  'overflow',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'gap',
  'rowGap',
  'columnGap',
] as const;

export const Container: React.FC<ContainerProps> = ({
  isVisible = true,
  style,
  ...rest
}) => {
  const inlineStyle = useMemo(() => {
    const viewStyles: ViewStyle = {};
    VIEW_STYLE_KEYS.forEach((key) => {
      const value = rest[key];
      if (value !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: TODO @cleo to review this
        (viewStyles as any)[key] = value;
      }
    });
    return viewStyles;
    // biome-ignore lint/correctness/useExhaustiveDependencies: biome is not smart enough to know that rest should not be a dependency
  }, [rest]);

  const passThroughProps = useMemo(() => {
    const clone: Record<string, unknown> = { ...rest };
    VIEW_STYLE_KEYS.forEach((k) => delete clone[k]);
    return clone as ViewProps;
    // biome-ignore lint/correctness/useExhaustiveDependencies: biome is not smart enough to know that rest should not be a dependency
  }, [rest]);

  if (!isVisible) return null;

  return <View {...passThroughProps} style={[inlineStyle, style]} />;
};
