import { AntigravityHeader } from "@/components/AntigravityHeader";
import { CadastroHeader } from "@/components/cadastro/CadastroHeader";
import { DadosAcesso } from "@/components/cadastro/DadosAcesso";
import { DadosPessoais } from "@/components/cadastro/DadosPessoais";
import { FormInput } from "@/components/cadastro/FormInput";
import { AntigravityPalette, Radii } from "@/constants/theme";
import { PerfilColaborador } from "@/models/ponto";
import {
  carregarPerfilStorage,
  carregarTurnoFavoritoStorage,
  listarChavesStorage,
  removerPerfilStorage,
  removerTurnoFavoritoStorage,
  salvarPerfilStorage,
  salvarTurnoFavoritoStorage,
} from "@/services/storageService";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CadastroScreen() {
  // Estados do formulário (Labs 2 a 4 + Aula 19)
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
  const [campoAtivo, setCampoAtivo] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [chavesGravadas, setChavesGravadas] = useState<string[]>([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);

  // Carrega automaticamente dados persistidos ao abrir a tela (Aula 19)
  useEffect(() => {
    carregarDadosPersistidos();
  }, []);

  async function atualizarListaChaves() {
    try {
      const keys = await listarChavesStorage();
      setChavesGravadas([...keys]);
    } catch (erro) {
      console.error("Erro ao listar chaves:", erro);
    }
  }

  // Prática 1 e 5 (Aula 19): Recuperar Dados com getItem + JSON.parse
  async function carregarDadosPersistidos() {
    try {
      const [perfilSalvo, turnoSalvo] = await Promise.all([
        carregarPerfilStorage(),
        carregarTurnoFavoritoStorage(),
      ]);

      if (turnoSalvo) {
        setTurnoFavorito(turnoSalvo);
      }

      if (perfilSalvo) {
        setNome(perfilSalvo.nome);
        setCpf(perfilSalvo.cpf);
        setEmail(perfilSalvo.email);
        setTelefone(perfilSalvo.telefone);
        setDataNascimento(perfilSalvo.dataNascimento);
        setCargo(perfilSalvo.cargo || "Engenheiro de Software Mobile");
        setTurnoFavorito(perfilSalvo.turnoFavorito || turnoSalvo || "Diurno (08h às 17h)");
        setAceitaTermos(perfilSalvo.aceitaTermos);
        setUltimaAtualizacao(perfilSalvo.atualizadoEm ?? null);
        setStatusMensagem(
          `Bem-vindo(a) de volta, ${perfilSalvo.nome}! Turno: ${perfilSalvo.turnoFavorito}.`
        );
      } else {
        setStatusMensagem("Nenhum perfil salvo no disco ainda. Preencha e clique em Salvar.");
      }

      await atualizarListaChaves();
    } catch (erro) {
      console.error("Erro ao carregar do AsyncStorage:", erro);
      setStatusMensagem("Erro ao ler dados do AsyncStorage.");
    }
  }

  // Eventos do Lab 4
  function handleSave() {
    setStatusMensagem("Evento onPress acionado: validando e persistindo no AsyncStorage...");
    handleCadastro();
  }

  function handleLongPress() {
    setStatusMensagem("Pressable: Pressão prolongada (onLongPress) detectada!");
    Alert.alert(
      "Evento onLongPress",
      "Você manteve o componente Pressable pressionado!"
    );
  }

  function handlePress() {
    setStatusMensagem("Pressable: Toque simples (onPress) realizado!");
  }

  function handleFocus() {
    setCampoAtivo(true);
  }

  function handleBlur() {
    setCampoAtivo(false);
  }

  function handleSubmit() {
    setStatusMensagem("Teclado: onSubmitEditing acionado no campo Nome!");
  }

  // Prática 1, 4 e 5 (Aula 19): Salvar Perfil em JSON (setItem + JSON.stringify)
  const handleCadastro = async () => {
    if (!nome.trim() || !email.trim()) {
      setStatusMensagem("Atenção: Preencha pelo menos Nome e E-mail para salvar.");
      Alert.alert(
        "Campos obrigatórios",
        "Preencha Nome e E-mail para gravar seu perfil no dispositivo."
      );
      return;
    }

    if (senha && confirmarSenha && senha !== confirmarSenha) {
      setStatusMensagem("Erro: A confirmação de senha não confere.");
      Alert.alert(
        "Erro de validação",
        "A confirmação de senha deve ser igual à senha digitada."
      );
      return;
    }

    if (!aceitaTermos) {
      setStatusMensagem("Atenção: Ative o Switch 'Aceitar termos' para continuar.");
      Alert.alert(
        "Termos de uso",
        "Ative a opção 'Aceitar termos' para concluir o registro."
      );
      return;
    }

    try {
      const novoPerfil: PerfilColaborador = {
        nome: nome.trim(),
        cpf: cpf.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        dataNascimento: dataNascimento.trim(),
        cargo: cargo.trim(),
        turnoFavorito: turnoFavorito.trim(),
        aceitaTermos,
      };

      // Grava objeto completo com JSON.stringify e string de preferência com setItem
      await salvarPerfilStorage(novoPerfil);
      await salvarTurnoFavoritoStorage(novoPerfil.turnoFavorito);

      // Limpa senhas da memória (Regra Aula 19: nunca persistir senhas no AsyncStorage)
      setSenha("");
      setConfirmarSenha("");

      const agoraStr = new Date().toLocaleString("pt-BR");
      setUltimaAtualizacao(agoraStr);
      await atualizarListaChaves();

      setStatusMensagem(
        `Perfil de "${novoPerfil.nome}" gravado no disco via AsyncStorage!`
      );
      Alert.alert(
        "Persistência Concluída (Aula 19)",
        `Objeto JSON salvo no AsyncStorage.\n\n• Colaborador: ${novoPerfil.nome}\n• Turno: ${novoPerfil.turnoFavorito}\n• Nota: Senha validada em RAM e não salva no disco (AsyncStorage sem criptografia).`
      );
    } catch (erro) {
      console.error("Erro ao salvar no AsyncStorage:", erro);
      setStatusMensagem("Falha ao gravar no AsyncStorage.");
    }
  };

  // Prática 3 (Aula 19): Apagar dados do disco com removeItem
  const handleRemoverDoStorage = async () => {
    try {
      await removerPerfilStorage();
      await removerTurnoFavoritoStorage();
      handleLimparMemoria();
      setUltimaAtualizacao(null);
      await atualizarListaChaves();
      setStatusMensagem(
        "Preferência e perfil removidos do disco (AsyncStorage.removeItem)!"
      );
    } catch (erro) {
      console.error("Erro ao remover do AsyncStorage:", erro);
    }
  };

  // Limpa apenas o useState (Memória de Curto Prazo)
  const handleLimparMemoria = () => {
    setNome("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setDataNascimento("");
    setCargo("");
    setTurnoFavorito("");
    setSenha("");
    setConfirmarSenha("");
    setAceitaTermos(false);
    setStatusMensagem(
      "Memória RAM (useState) limpa. Clique em 'Carregar do Disco' para recuperar do AsyncStorage!"
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AntigravityHeader
          badgeText="✦ AULA 19 · ASYNCSTORAGE"
          title="Identidade & Persistência Local"
          subtitle="Memória de longo prazo no dispositivo com JSON.stringify e JSON.parse"
        />

        {/* Painel de Status da Persistência (Aula 19) */}
        <View style={styles.storageBanner}>
          <View style={styles.storageHeaderRow}>
            <Text style={styles.storageBannerTitle}>
              Cofre Local (AsyncStorage)
            </Text>
            <View style={styles.pillCount}>
              <Text style={styles.pillCountText}>
                {chavesGravadas.length} chaves ativas
              </Text>
            </View>
          </View>

          <Text style={styles.storageBannerDesc}>
            Turno favorito salvo:{" "}
            <Text style={styles.boldText}>
              {turnoFavorito || "Nenhuma preferência salva"}
            </Text>
          </Text>

          {ultimaAtualizacao ? (
            <Text style={styles.storageTimestamp}>
              Última gravação em disco: {ultimaAtualizacao}
            </Text>
          ) : null}

          <View style={styles.storageButtonsRow}>
            <TouchableOpacity
              style={styles.pillBtnPrimary}
              onPress={handleSave}
            >
              <Text style={styles.pillBtnPrimaryText}>Salvar (setItem)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pillBtnSecondary}
              onPress={carregarDadosPersistidos}
            >
              <Text style={styles.pillBtnSecondaryText}>Carregar (getItem)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pillBtnDanger}
              onPress={handleRemoverDoStorage}
            >
              <Text style={styles.pillBtnDangerText}>Remover (removeItem)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <CadastroHeader
            title="Ficha do Colaborador"
            subtitle="Altere seus dados, feche o app e reabra para testar a persistência"
          />

          <DadosPessoais
            nome={nome}
            onChangeNome={setNome}
            onFocusNome={handleFocus}
            onBlurNome={handleBlur}
            onSubmitEditingNome={handleSubmit}
            cpf={cpf}
            onChangeCpf={setCpf}
            email={email}
            onChangeEmail={setEmail}
            telefone={telefone}
            onChangeTelefone={setTelefone}
            dataNascimento={dataNascimento}
            onChangeDataNascimento={setDataNascimento}
          />

          {/* Campos extras da Aula 19: Cargo e Turno Favorito */}
          <FormInput
            label="Cargo / Função"
            placeholder="Ex: Desenvolvedor Mobile"
            value={cargo}
            onChangeText={setCargo}
          />

          <FormInput
            label="Turno / Jornada Favorita (Prática 4 - Aula 19)"
            placeholder="Ex: Diurno (08h às 17h) ou Flexível"
            value={turnoFavorito}
            onChangeText={setTurnoFavorito}
          />

          {campoAtivo ? (
            <Text style={styles.focoIndicador}>
              {"Campo 'Nome Completo' está ativo (evento onFocus)"}
            </Text>
          ) : null}

          {nome.trim() ? (
            <Text style={styles.previewTexto}>
              Estado em RAM (useState): {nome} · {turnoFavorito}
            </Text>
          ) : null}

          <DadosAcesso
            senha={senha}
            onChangeSenha={setSenha}
            confirmarSenha={confirmarSenha}
            onChangeConfirmarSenha={setConfirmarSenha}
          />

          {/* Aviso de Segurança explícito da Aula 19 (Slide 5 e 15) */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityNoticeText}>
              ⚠️ Regra de Segurança (Aula 19): O AsyncStorage não possui
              criptografia por padrão. Sua senha é validada apenas em memória e
              nunca é gravada em texto puro no disco.
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <Switch
              value={aceitaTermos}
              onValueChange={setAceitaTermos}
              trackColor={{
                false: AntigravityPalette.border,
                true: AntigravityPalette.obsidian,
              }}
              thumbColor={AntigravityPalette.canvas}
            />
            <Text style={styles.switchTexto}>
              {aceitaTermos
                ? "Termos de ponto eletrônico aceitos"
                : "Aceitar termos de ponto eletrônico"}
            </Text>
          </View>

          {statusMensagem ? (
            <Text style={styles.statusMensagem}>{statusMensagem}</Text>
          ) : null}

          <View style={styles.acoesContainer}>
            <TouchableOpacity style={styles.ctaObsidian} onPress={handleSave}>
              <Text style={styles.ctaObsidianText}>
                Salvar Perfil no AsyncStorage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaSlate}
              onPress={handleLimparMemoria}
            >
              <Text style={styles.ctaSlateText}>
                Limpar apenas useState (Teste de Curto Prazo)
              </Text>
            </TouchableOpacity>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.pressableArea,
              pressed && styles.pressablePressed,
            ]}
            onPress={handlePress}
            onLongPress={handleLongPress}
          >
            <Text style={styles.pressableText}>
              Toque simples (onPress) ou segure (onLongPress)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AntigravityPalette.canvas,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 18,
  },
  storageBanner: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    gap: 8,
  },
  storageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storageBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AntigravityPalette.obsidian,
  },
  pillCount: {
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  pillCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: AntigravityPalette.cobaltBlue,
  },
  storageBannerDesc: {
    fontSize: 13,
    color: AntigravityPalette.slate,
  },
  boldText: {
    fontWeight: "700",
    color: AntigravityPalette.obsidian,
  },
  storageTimestamp: {
    fontSize: 12,
    color: AntigravityPalette.muted,
  },
  storageButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  pillBtnPrimary: {
    backgroundColor: AntigravityPalette.obsidian,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  pillBtnPrimaryText: {
    color: AntigravityPalette.canvas,
    fontSize: 12,
    fontWeight: "600",
  },
  pillBtnSecondary: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  pillBtnSecondaryText: {
    color: AntigravityPalette.obsidian,
    fontSize: 12,
    fontWeight: "600",
  },
  pillBtnDanger: {
    backgroundColor: AntigravityPalette.coralTint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  pillBtnDangerText: {
    color: AntigravityPalette.coralRed,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  securityNotice: {
    backgroundColor: AntigravityPalette.amberTint,
    borderRadius: Radii.input,
    padding: 12,
    marginBottom: 12,
  },
  securityNoticeText: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
    fontWeight: "500",
  },
  statusMensagem: {
    textAlign: "center",
    color: AntigravityPalette.cobaltBlue,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: AntigravityPalette.blueTint,
    borderRadius: Radii.input,
  },
  acoesContainer: {
    marginTop: 8,
    gap: 10,
  },
  ctaObsidian: {
    minHeight: 48,
    backgroundColor: AntigravityPalette.obsidian,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  ctaObsidianText: {
    color: AntigravityPalette.canvas,
    fontSize: 15,
    fontWeight: "600",
  },
  ctaSlate: {
    minHeight: 48,
    backgroundColor: AntigravityPalette.surfaceAlt,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  ctaSlateText: {
    color: AntigravityPalette.obsidian,
    fontSize: 14,
    fontWeight: "600",
  },
  pressableArea: {
    marginTop: 14,
    minHeight: 48,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: AntigravityPalette.electricBlue,
    backgroundColor: AntigravityPalette.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  pressablePressed: {
    backgroundColor: AntigravityPalette.blueTint,
  },
  pressableText: {
    color: AntigravityPalette.cobaltBlue,
    fontSize: 13,
    fontWeight: "600",
  },
  previewTexto: {
    fontSize: 13,
    color: AntigravityPalette.emerald,
    backgroundColor: AntigravityPalette.emeraldTint,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.input,
    marginBottom: 12,
    fontWeight: "600",
  },
  focoIndicador: {
    fontSize: 13,
    color: AntigravityPalette.cobaltBlue,
    backgroundColor: AntigravityPalette.blueTint,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.input,
    marginBottom: 12,
    fontWeight: "600",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  switchTexto: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: AntigravityPalette.obsidian,
  },
});
