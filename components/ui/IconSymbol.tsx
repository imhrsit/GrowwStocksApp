import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'star.fill': 'star',
  'star': 'star-border',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'chart.bar': 'bar-chart',
  'newspaper': 'article',
  'bookmark.fill': 'bookmark',
  'bookmark': 'bookmark-border',
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'brightness-3',
  'gear': 'settings',
  'magnifyingglass': 'search',
  'circle.fill': 'circle',
  'arrow.up': 'keyboard-arrow-up',
  'arrow.down': 'keyboard-arrow-down',
  'minus': 'remove',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'plus': 'add',
  'trash': 'delete',
  'checkmark': 'check',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialIconName = MAPPING[name];
  
  if (!materialIconName) {
    console.warn(`IconSymbol: No mapping found for "${name}". Add it to the MAPPING object.`);
    return <MaterialIcons color={color} size={size} name="help-outline" style={style} />;
  }
  
  return <MaterialIcons color={color} size={size} name={materialIconName} style={style} />;
}
