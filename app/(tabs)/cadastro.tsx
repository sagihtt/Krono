import { AppShell } from "@/components/AppShell";
import { DadosAcesso } from "@/components/cadastro/DadosAcesso";
import { DadosPessoais } from "@/components/cadastro/DadosPessoais";
import { FormInput } from "@/components/cadastro/FormInput";
import { AntigravityPalette, Radii } from "@/constants/theme";
import { PerfilColaborador } from "@/models/ponto";
import {
  carregarPerfilStorage,
  carregarTurnoFavoritoStorage,
  removerPerfilStorage,
  removerTurnoFavoritoStorage,
  salvarPerfilStorage,
  salvarTurnoFavoritoStorage,
} from "@/services/storageService";
import Feather from "@expo/vector-icons/Feather";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const TURNOS_LINHAS = [
  ["Diurno (08h às 17h)", "Flexível (09h às 18h)"],
  ["Escala 12x36", "Remoto / Híbrido"],
];

export default function CadastroScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 880;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cargo, setCargo] = useState("Engenheiro de Software Mobile");
  const [turnoFavorito, setTurnoFavorito] = useState("Diurno (08h às 17h)");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [statusMensagem, setStatusMensagem] = useState("");
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(
    null
  );

  const carregarDadosPersistidos = useCallback(async () => {
    try {
      const [perfilSalvo, turnoSalvo] = await Promise.all([
        carregarPerfilStorage(),
        carregarTurnoFavoritoStorage(),
      ]);

      if (turnoSalvo) {
        setTurnoFavorito(turnoSalvo);
      }

      if (perfilSalvo) {
        setNome(perfilSalvo.nome || "");
        setCpf(perfilSalvo.cpf || "");
        setEmail(perfilSalvo.email || "");
        setTelefone(perfilSalvo.telefone || "");
        setDataNascimento(perfilSalvo.dataNascimento || "");
        setCargo(perfilSalvo.cargo || "Engenheiro de Software Mobile");
        setTurnoFavorito(
          perfilSalvo.turnoFavorito || turnoSalvo || "Diurno (08h às 17h)"
        );
        setAceitaTermos(Boolean(perfilSalvo.aceitaTermos));
        setUltimaAtualizacao(perfilSalvo.atualizadoEm ?? null);
        setStatusMensagem(
          perfilSalvo.nome
            ? `Perfil de ${perfilSalvo.nome} sincronizado.`
            : "Complete suas informações abaixo para personalizar seus comprovantes."
        );
      } else {
        setStatusMensagem(
          "Complete suas informações abaixo para personalizar seus comprovantes."
        );
      }
    } catch {
      setStatusMensagem("Não foi possível carregar os dados salvos.");
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.all([carregarPerfilStorage(), carregarTurnoFavoritoStorage()])
      .then(([perfilSalvo, turnoSalvo]) => {
        if (!ativo) return;
        if (turnoSalvo) {
          setTurnoFavorito(turnoSalvo);
        }
        if (perfilSalvo) {
          setNome(perfilSalvo.nome || "");
          setCpf(perfilSalvo.cpf || "");
          setEmail(perfilSalvo.email || "");
          setTelefone(perfilSalvo.telefone || "");
          setDataNascimento(perfilSalvo.dataNascimento || "");
          setCargo(perfilSalvo.cargo || "Engenheiro de Software Mobile");
          setTurnoFavorito(
            perfilSalvo.turnoFavorito || turnoSalvo || "Diurno (08h às 17h)"
          );
          setAceitaTermos(Boolean(perfilSalvo.aceitaTermos));
          setUltimaAtualizacao(perfilSalvo.atualizadoEm ?? null);
          setStatusMensagem(
            perfilSalvo.nome
              ? `Perfil de ${perfilSalvo.nome} sincronizado.`
              : "Complete suas informações abaixo para personalizar seus comprovantes."
          );
        } else {
          setStatusMensagem(
            "Complete suas informações abaixo para personalizar seus comprovantes."
          );
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  async function handleSalvarCadastro() {
    if (!nome.trim()) {
      Alert.alert("Campo obrigatório", "Informe seu nome completo.");
      return;
    }

    if (!aceitaTermos) {
      Alert.alert(
        "Confirmação necessária",
        "Confirme a veracidade dos dados cadastrais antes de salvar."
      );
      return;
    }

    if (senha && senha !== confirmarSenha) {
      Alert.alert(
        "Senhas diferentes",
        "A confirmação de senha não coincide com a senha digitada."
      );
      return;
    }

    const agora = new Date().toLocaleString("pt-BR");
    const novoPerfil: PerfilColaborador = {
      nome: nome.trim(),
      cpf,
      email: email.trim(),
      telefone,
      dataNascimento,
      cargo: cargo.trim(),
      turnoFavorito,
      aceitaTermos,
      atualizadoEm: agora,
    };

    try {
      await Promise.all([
        salvarPerfilStorage(novoPerfil),
        salvarTurnoFavoritoStorage(turnoFavorito),
      ]);

      setSenha("");
      setConfirmarSenha("");
      setUltimaAtualizacao(agora);
      setStatusMensagem(`Alterações salvas em ${agora}.`);

      Alert.alert(
        "Perfil atualizado",
        "Seus dados cadastrais e preferências de turno foram salvos."
      );
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    }
  }

  function handleDescartarSessao() {
    setNome("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setDataNascimento("");
    setSenha("");
    setConfirmarSenha("");
    setAceitaTermos(false);
    setStatusMensagem(
      "Campos limpos na tela. Toque em Restaurar para recarregar os dados salvos."
    );
  }

  async function handleRedefinirCadastro() {
    try {
      await Promise.all([
        removerPerfilStorage(),
        removerTurnoFavoritoStorage(),
      ]);
      setNome("");
      setCpf("");
      setEmail("");
      setTelefone("");
      setDataNascimento("");
      setSenha("");
      setConfirmarSenha("");
      setAceitaTermos(false);
      setUltimaAtualizacao(null);
      setStatusMensagem("Os dados cadastrais foram removidos deste aparelho.");
      Alert.alert("Cadastro redefinido", "Seus dados foram apagados do dispositivo.");
    } catch {
      Alert.alert("Erro", "Não foi possível redefinir o cadastro.");
    }
  }

  const iniciais = nome.trim()
    ? nome
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "TC";

  return (
    <AppShell
      title="Meu perfil"
      subtitle="Dados cadastrais, jornada e preferências"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.container, isWide && styles.containerWide]}>
            <View style={[styles.column, isWide && styles.columnHalf]}>
              <View style={styles.identityCard}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>{iniciais}</Text>
                </View>
                <View style={styles.identityTextCol}>
                  <Text style={styles.identityName}>
                    {nome.trim() || "Colaborador Krono"}
                  </Text>
                  <Text style={styles.identityRole}>
                    {cargo.trim() || "Defina seu cargo abaixo"}
                  </Text>
                  {ultimaAtualizacao ? (
                    <Text style={styles.updatedCaption}>
                      Atualizado em {ultimaAtualizacao}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.card}>
                <DadosPessoais
                  nome={nome}
                  onChangeNome={setNome}
                  cpf={cpf}
                  onChangeCpf={setCpf}
                  email={email}
                  onChangeEmail={setEmail}
                  telefone={telefone}
                  onChangeTelefone={setTelefone}
                  dataNascimento={dataNascimento}
                  onChangeDataNascimento={setDataNascimento}
                />
              </View>
            </View>

            <View style={[styles.column, isWide && styles.columnHalf]}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Cargo e jornada</Text>
                <FormInput
                  label="Cargo ou Função"
                  placeholder="Ex: Engenheiro de Software"
                  value={cargo}
                  onChangeText={setCargo}
                />

                <Text style={styles.fieldLabel}>Turno de trabalho padrão</Text>
                <View style={styles.shiftsGrid}>
                  {TURNOS_LINHAS.map((linha, rowIdx) => (
                    <View key={rowIdx} style={styles.shiftRow}>
                      {linha.map((turno) => {
                        const selecionado = turnoFavorito === turno;
                        return (
                          <TouchableOpacity
                            key={turno}
                            style={[
                              styles.shiftChip,
                              selecionado && styles.shiftChipActive,
                            ]}
                            onPress={() => setTurnoFavorito(turno)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.shiftChipText,
                                selecionado && styles.shiftChipTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {turno}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <DadosAcesso
                  senha={senha}
                  onChangeSenha={setSenha}
                  confirmarSenha={confirmarSenha}
                  onChangeConfirmarSenha={setConfirmarSenha}
                />

                <View style={styles.privacyBanner}>
                  <Feather
                    name="shield"
                    size={15}
                    color={AntigravityPalette.cobaltBlue}
                  />
                  <Text style={styles.privacyBannerText}>
                    Por segurança, sua senha é utilizada apenas para validação da sessão e não fica gravada no armazenamento local.
                  </Text>
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextCol}>
                    <Text style={styles.switchLabel}>
                      Confirmo que as informações acima estão atualizadas
                    </Text>
                  </View>
                  <Switch
                    value={aceitaTermos}
                    onValueChange={setAceitaTermos}
                    trackColor={{
                      false: AntigravityPalette.border,
                      true: AntigravityPalette.obsidian,
                    }}
                    thumbColor={AntigravityPalette.canvas}
                  />
                </View>

                {statusMensagem ? (
                  <Text style={styles.statusFeedback}>{statusMensagem}</Text>
                ) : null}

                <View style={styles.actionsStack}>
                  <TouchableOpacity
                    style={styles.primarySaveBtn}
                    onPress={handleSalvarCadastro}
                    activeOpacity={0.85}
                  >
                    <Feather
                      name="check"
                      size={16}
                      color={AntigravityPalette.canvas}
                    />
                    <Text style={styles.primarySaveBtnText}>
                      Salvar alterações
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.secondaryButtonsRow}>
                    <TouchableOpacity
                      style={styles.secondaryPillBtn}
                      onPress={carregarDadosPersistidos}
                    >
                      <Feather
                        name="refresh-cw"
                        size={13}
                        color={AntigravityPalette.obsidian}
                      />
                      <Text style={styles.secondaryPillText}>Restaurar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryPillBtn}
                      onPress={handleDescartarSessao}
                    >
                      <Feather
                        name="rotate-ccw"
                        size={13}
                        color={AntigravityPalette.obsidian}
                      />
                      <Text style={styles.secondaryPillText}>
                        Limpar campos
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dangerPillBtn}
                      onPress={handleRedefinirCadastro}
                    >
                      <Feather
                        name="trash-2"
                        size={13}
                        color={AntigravityPalette.coralRed}
                      />
                      <Text style={styles.dangerPillText}>Redefinir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  container: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  containerWide: {
    maxWidth: 1080,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  column: {
    gap: 16,
  },
  columnHalf: {
    flex: 1,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AntigravityPalette.obsidian,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLargeText: {
    color: AntigravityPalette.canvas,
    fontSize: 18,
    fontWeight: "600",
  },
  identityTextCol: {
    flex: 1,
    minWidth: 0,
  },
  identityName: {
    fontSize: 17,
    fontWeight: "600",
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  identityRole: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    marginTop: 2,
  },
  updatedCaption: {
    fontSize: 11,
    color: AntigravityPalette.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AntigravityPalette.obsidian,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AntigravityPalette.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: AntigravityPalette.slate,
    marginTop: 6,
    marginBottom: 10,
  },
  shiftsGrid: {
    gap: 10,
  },
  shiftRow: {
    flexDirection: "row",
    gap: 10,
  },
  shiftChip: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  shiftChipActive: {
    backgroundColor: AntigravityPalette.obsidian,
    borderColor: AntigravityPalette.obsidian,
  },
  shiftChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: AntigravityPalette.slate,
    textAlign: "center",
  },
  shiftChipTextActive: {
    color: AntigravityPalette.canvas,
    fontWeight: "600",
  },
  privacyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AntigravityPalette.blueTint,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 12,
    color: AntigravityPalette.obsidian,
    lineHeight: 17,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AntigravityPalette.canvas,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    gap: 12,
    marginBottom: 14,
  },
  switchTextCol: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: AntigravityPalette.obsidian,
  },
  statusFeedback: {
    fontSize: 12,
    color: AntigravityPalette.slate,
    textAlign: "center",
    marginBottom: 14,
  },
  actionsStack: {
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  primarySaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    width: "100%",
    maxWidth: 320,
  },
  primarySaveBtnText: {
    color: AntigravityPalette.canvas,
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  secondaryPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  secondaryPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: AntigravityPalette.obsidian,
  },
  dangerPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AntigravityPalette.coralTint,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  dangerPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: AntigravityPalette.coralRed,
  },
});
