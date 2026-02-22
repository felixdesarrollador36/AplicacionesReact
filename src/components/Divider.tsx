import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

export const Divider: React.FC<DividerProps> = ({
  style,
  color = '#eeeeee',
  thickness = 1,
  marginVertical = 16,
}) => {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
