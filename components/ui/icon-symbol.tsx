import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { type ColorValue, type StyleProp, type TextStyle } from 'react-native';

type SymbolNameString = Extract<SymbolViewProps['name'], string>;
type IconMapping = Record<SymbolNameString, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'schedule',
  'paperplane.fill': 'folder-special',
  'person.fill': 'badge',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={typeof color === 'string' ? color : undefined}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
