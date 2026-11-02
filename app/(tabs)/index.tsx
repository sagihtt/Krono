import { RegistroCard } from "@/components/RegistroCard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PontoRegistro, PONTOS_INICIAIS } from "@/constants/pontosMock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();

  // =============================================================
  // ETAPA 2: DADOS DA APLICAÇÃO EM UMA LISTA (Mínimo de 5 itens)
  // Iniciamos o State com os 5 registros padronizados do tema
  // =============================================================
  const [pontos, setPontos] = useState<PontoRegistro[]>(PONTOS_INICIAIS);

  // =============================================================
  // ETAPA 5: STATE PARA CONTROLAR A INTERFACE (Modo compacto)
  // Altera a estrutura visual dos cards renderizados
  // =============================================================
  const [modoCompacto, setModoCompacto] = useState<boolean>(false);

  const cameraRef = useRef<CameraView>(null);

  // =============================================================
  // ETAPA 8, 9 e 14: NAVEGAÇÃO PROGRAMÁTICA COM useRouter()
  // - Onde foi utilizado: nas funções abrirPrimeiroRegistro e handleAbrirDetalhes.
  // - Qual interação dispara: o evento onPress do botão ou toque no card.
  // - Diferença do Link: permite validações e lógica via código antes do push.
  // =============================================================
  const router = useRouter();

  useEffect(() => {
    carregarPontos();
  }, []);

  const carregarPontos = async () => {
    try {
      const registros = await AsyncStorage.getItem("@pontos");
      if (registros) {
        const salvos: PontoRegistro[] = JSON.parse(registros);
        // Garante que os registros mockados continuem na lista junto com os novos salvos
        setPontos([...salvos, ...PONTOS_INICIAIS]);
      }
    } catch (e) {
      console.error("Erro ao carregar pontos", e);
    }
  };

  const salvarPonto = async (novoPonto: PontoRegistro) => {
    try {
      const novosPontos = [novoPonto, ...pontos];
      await AsyncStorage.setItem("@pontos", JSON.stringify(novosPontos));
      setPontos(novosPontos);
    } catch (e) {
      console.error("Erro ao salvar ponto", e);
    }
  };

  const registrarPonto = async () => {
    // 1. Autenticação Local (Biometria)
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua identidade para bater o ponto",
      });
      if (!authResult.success) {
        Alert.alert("Erro", "Autenticação falhou! Tente novamente.");
        return;
      }
    } else {
      Alert.alert(
        "Aviso",
        "Biometria não suportada no seu emulador/dispositivo. Pulando etapa de validação.",
      );
    }

    // 2. Localização
    if (!locationPermission?.granted) {
      const locationStatus = await requestLocationPermission();
      if (!locationStatus.granted) {
        Alert.alert("Erro", "Permissão de localização é necessária.");
        return;
      }
    }
    const location = await Location.getCurrentPositionAsync({});

    // 3. Foto da Câmera
    if (!permission?.granted) {
      const cameraStatus = await requestPermission();
      if (!cameraStatus.granted) {
        Alert.alert("Erro", "Permissão de câmera é necessária.");
        return;
      }
    }

    if (cameraRef.current) {
      try {
        await cameraRef.current.takePictureAsync();
      } catch (e) {
        console.error("Erro ao tirar foto silenciosa", e);
      }
    }

    // 4. Criação do novo registro
    const agora = dayjs();
    const proximoId = (pontos.length + 1).toString();
    const novoPonto: PontoRegistro = {
      id: proximoId,
      titulo: `Registro #${proximoId} - Ponto Batido`,
      categoria: "Ponto Manual",
      dataHora: agora.format("DD/MM/YYYY HH:mm:ss"),
      localizacao: "Sede Principal - Bloco A",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      observacao: "Registro realizado com foto e geolocalização no app.",
    };

    await salvarPonto(novoPonto);
    Alert.alert("Sucesso", "Ponto registrado com sucesso!");
  };

  // Etapa 8: Navegação programática com router.push para rota fixa
  function abrirPrimeiroRegistro() {
    router.push("/detalhes/1");
  }

  // Etapa 9: Navegação programática com envio dinâmico do ID do item
  function handleAbrirDetalhes(id: string) {
    router.push(`/detalhes/${id}`);
  }

  return (
    <FlatList
      data={pontos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListHeaderComponent={
        <View>
          {/* Header com Câmera */}
          <View style={styles.cameraContainer}>
            {!permission ? (
              <View />
            ) : !permission.granted ? (
              <TouchableOpacity
                style={styles.actionButtonCamera}
                onPress={requestPermission}
              >
                <Text style={styles.actionButtonText}>Liberar Câmera</Text>
              </TouchableOpacity>
            ) : (
              <CameraView style={styles.camera} ref={cameraRef} facing="front" />
            )}
          </View>

          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Registro de Ponto</ThemedText>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={registrarPonto}>
              <Text style={styles.actionButtonText}>BATER PONTO</Text>
            </TouchableOpacity>
          </ThemedView>

          {/* ============================================================= */}
          {/* ETAPA 14: DIFERENCIAR LINK E NAVEGAÇÃO PROGRAMÁTICA           */}
          {/* 1. NAVEGAÇÃO DECLARATIVA COM COMPONENTE <Link>:               */}
          {/* - Onde foi utilizado: bloco abaixo no JSX.                    */}
          {/* - Qual interação dispara: toque direto no componente Link.   */}
          {/* - Não necessita invocar funções no código JavaScript.          */}
          {/* ============================================================= */}
          <View style={styles.navDemoContainer}>
            <ThemedText type="subtitle">Formas de Navegação (Lab 5)</ThemedText>

            {/* Etapa 7: Link declarativo para rota fixa /detalhes/1 */}
            <Link href="/detalhes/1" style={styles.linkDeclarativo}>
              <Text style={styles.linkText}>
                Navegar via Link Declarativo (/detalhes/1)
              </Text>
            </Link>

            {/* Etapa 8: Botão programático com router.push */}
            <View style={styles.botaoProgramaticoWrapper}>
              <Button
                title="Navegar via useRouter() (/detalhes/1)"
                onPress={abrirPrimeiroRegistro}
                color="#0284c7"
              />
            </View>
          </View>

          {/* ============================================================= */}
          {/* ETAPA 5: STATE ALTERANDO A INTERFACE (Modo compacto)          */}
          {/* ============================================================= */}
          <View style={styles.switchBox}>
            <Switch
              value={modoCompacto}
              onValueChange={setModoCompacto}
              trackColor={{ false: "#d1d5db", true: "#0a7ea4" }}
              thumbColor={modoCompacto ? "#ffffff" : "#f4f3f4"}
            />
            <Text style={styles.switchTexto}>
              {modoCompacto ? "Modo compacto ativado" : "Modo compacto desativado"}
            </Text>
          </View>

          <ThemedText type="subtitle" style={styles.secaoTitulo}>
            Histórico de Pontos (Toque no card para detalhes):
          </ThemedText>
        </View>
      }
      // =============================================================
      // ETAPAS 3, 4, 9 e 13: INTEGRAÇÃO FLATLIST + PROPS + CARD + NAVEGAÇÃO
      // =============================================================
      renderItem={({ item }) => (
        <RegistroCard
          titulo={item.titulo}
          categoria={item.categoria}
          dataHora={item.dataHora}
          modoCompacto={modoCompacto}
          onPress={() => handleAbrirDetalhes(item.id)}
        />
      )}
      ListFooterComponent={
        <ThemedView style={styles.techContainer}>
          <ThemedText
            type="subtitle"
            style={{ textAlign: "center", marginBottom: 8 }}
          >
            Tecnologias do Laboratório:
          </ThemedText>
          <ThemedText>• Expo Router (Rotas Dinâmicas [id].tsx)</ThemedText>
          <ThemedText>• FlatList & Componentes Reutilizáveis</ThemedText>
          <ThemedText>• State, Props e useLocalSearchParams</ThemedText>
          <ThemedText>• Link & useRouter (router.push / router.back)</ThemedText>
        </ThemedView>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: "#f9fafb",
  },
  cameraContainer: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    marginBottom: 16,
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  stepContainer: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  actionButton: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonCamera: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  navDemoContainer: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
    gap: 8,
  },
  linkDeclarativo: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  linkText: {
    color: "#15803d",
    fontWeight: "600",
    textAlign: "center",
  },
  botaoProgramaticoWrapper: {
    marginTop: 4,
  },
  switchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    gap: 12,
  },
  switchTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  secaoTitulo: {
    marginBottom: 10,
  },
  techContainer: {
    gap: 4,
    marginTop: 20,
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
