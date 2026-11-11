import { AntigravityPalette, Radii } from "@/constants/theme";
import React, { useEffect, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text } from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export interface BotaoPressProps {
  titulo: string;
  onPress: () => void;
  cor?: string;
  variante?: "primary" | "secondary" | "danger" | "blue";
}

export const BotaoPress: React.FC<BotaoPressProps> = ({
  titulo,
  onPress,
  cor,
  variante = "primary",
}) => {
  const [scaleValue] = useState(() => new Animated.Value(1));

  useEffect(() => {
    scaleValue.setValue(1);
  }, [scaleValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 200,
      bounciness: 16,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 200,
      bounciness: 16,
    }).start();
  };

  const bgPadrao =
    cor ??
    (variante === "secondary"
      ? AntigravityPalette.surfaceAlt
      : variante === "danger"
      ? AntigravityPalette.coralRed
      : variante === "blue"
      ? AntigravityPalette.electricBlue
      : AntigravityPalette.obsidian);

  const corTexto =
    variante === "secondary" && !cor
      ? AntigravityPalette.obsidian
      : AntigravityPalette.canvas;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        {
          backgroundColor: bgPadrao,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  botao: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    marginTop: 8,
  },
  texto: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
    textAlign: "center",
  },
});

export default BotaoPress;
