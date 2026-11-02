import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';

export function HapticTab(props: any) {
  const { pressColor, ...rest } = props;
  return (
    <PlatformPressable
      {...rest}
      pressColor={typeof pressColor === 'string' ? pressColor : undefined}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
