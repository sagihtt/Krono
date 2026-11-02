import { AntigravityPalette, Radii } from "@/constants/theme";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface BotaoPressProps {
  titulo: string;
  onPress: () => void;
  cor?: string;
  variante?: "primary" | "secondary" | "danger";
}

const BotaoPress: React.FC<BotaoPressProps> = ({
  titulo,
  onPress,
  cor,
  variante = "primary",
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scaleValue.setValue(1);
  }, [scaleValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 200,
      bounciness: 16,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
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
  },
  texto: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
});

export default BotaoPress;
