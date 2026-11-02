import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface BotaoPressProps {
  titulo: string;
  onPress: () => void;
  cor?: string;
}

const BotaoPress: React.FC<BotaoPressProps> = ({
  titulo,
  onPress,
  cor = "#007AFF",
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scaleValue.setValue(1); // Resetar sempre que o componente montar
  }, [scaleValue]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 200,
      bounciness: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 200,
      bounciness: 20,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        {
          backgroundColor: pressed ? cor : cor,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Text style={styles.texto}>{titulo}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  botao: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  texto: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});

export default BotaoPress;
