import { CadastroHeader } from "@/components/cadastro/CadastroHeader";
import { DadosAcesso } from "@/components/cadastro/DadosAcesso";
import { DadosPessoais } from "@/components/cadastro/DadosPessoais";
import React, { useState } from "react";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function CadastroScreen() {
  // =============================================================
  // ETAPA 9: RELAÇÃO ENTRE PROPS, EVENTOS E STATE (Exemplo State)
  // - State: 'nome' armazena o valor dinâmico em memória.
  // - Evento: 'onChangeText' captura a digitação e executa 'setNome'.
  // - Prop: 'value' recebe o valor do State e envia ao TextInput.
  // =============================================================
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [statusMensagem, setStatusMensagem] = useState("");
  const [campoAtivo, setCampoAtivo] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);

  // Evento disparado com o "toque" do usuário no botão (Etapa 2)
  function handleSave() {
    console.log("Botão pressionado");
    setStatusMensagem("Botão pressionado via evento onPress!");
    handleCadastro();
  }

  // Evento disparado no momento que o usuário "pressiona" o botão por um período (Etapa 3)
  function handleLongPress() {
    console.log("Pressão prolongada");
    setStatusMensagem("Pressable: Pressão prolongada detectada!");
    Alert.alert("Evento onLongPress", "Você manteve o componente Pressable pressionado!");
  }

  // Evento disparado com o "toque" no componente Pressable (Etapa 3)
  function handlePress() {
    console.log("Toque realizado");
    setStatusMensagem("Pressable: Toque simples realizado!");
  }

  // Quando o campo receber foco (Etapa 5)
  function handleFocus() {
    console.log("Campo recebeu o foco");
    setCampoAtivo(true);
  }

  // Quando perder o foco (Etapa 5)
  function handleBlur() {
    console.log("Campo perdeu o foco");
    setCampoAtivo(false);
  }

  // Evento disparado ao acionar o envio pelo teclado (Etapa 6)
  function handleSubmit() {
    console.log("Campo enviado");
    setStatusMensagem("Teclado: onSubmitEditing acionado no campo Nome!");
    Alert.alert("Evento onSubmitEditing", "Ação de envio disparada diretamente pelo teclado.");
  }

  // =============================================================
  // ETAPA 10: COMPORTAMENTO INTEGRADO PARA A TELA
  // O botão 'Cadastrar' integra os states alimentados pelos eventos:
  // - nome, email, senha (atualizados via onChangeText)
  // - aceitaTermos (atualizado via onValueChange do Switch)
  // =============================================================
  const handleCadastro = () => {
    if (!nome.trim() || !email.trim() || !senha) {
      setStatusMensagem("Atenção: Preencha pelo menos Nome, E-mail e Senha.");
      Alert.alert(
        "Campos incompletos",
        "Preencha os campos obrigatórios (Nome, E-mail e Senha) para continuar."
      );
      return;
    }

    if (confirmarSenha && senha !== confirmarSenha) {
      setStatusMensagem("Erro: A confirmação de senha não confere.");
      Alert.alert(
        "Erro de validação",
        "A confirmação de senha deve ser igual à senha digitada."
      );
      return;
    }

    if (!aceitaTermos) {
      setStatusMensagem("Atenção: Você precisa aceitar os termos de uso no Switch.");
      Alert.alert(
        "Termos não aceitos",
        "Ative a opção 'Aceitar termos' para concluir o cadastro."
      );
      return;
    }

    setStatusMensagem(`Cadastro de "${nome}" realizado com sucesso!`);
    Alert.alert(
      "Cadastro Integrado com Sucesso",
      `Dados consolidados:\n\n• Nome: ${nome}\n• E-mail: ${email}\n• Termos: Aceitos`
    );
  };

  const handleLimpar = () => {
    setNome("");
    setCpf("");
    setEmail("");
    setTelefone("");
    setDataNascimento("");
    setSenha("");
    setConfirmarSenha("");
    setStatusMensagem("");
    setAceitaTermos(false);
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
        <View style={styles.card}>
          {/* Área de título */}
          <CadastroHeader
            title="Cadastro de Usuário"
            subtitle="Preencha os campos para concluir o registro"
          />

          {/* Área de informações pessoais (com campos de entrada) */}
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

          {/* Indicação visual de alteração provocada pelo foco (Etapa 5) */}
          {campoAtivo ? (
            <Text style={styles.focoIndicador}>
              {"Campo 'Nome Completo' está ativo (em foco)"}
            </Text>
          ) : null}

          {/* Demonstração visual do State atualizado em tempo real (Etapa 4) */}
          {nome.trim() ? (
            <Text style={styles.previewTexto}>Nome no State: {nome}</Text>
          ) : null}

          {/* Área de informações de acesso (com campos de entrada) */}
          <DadosAcesso
            senha={senha}
            onChangeSenha={setSenha}
            confirmarSenha={confirmarSenha}
            onChangeConfirmarSenha={setConfirmarSenha}
          />

          {/* ============================================================= */}
          {/* ETAPA 9: RELAÇÃO ENTRE PROPS, EVENTOS E STATE NO SWITCH       */}
          {/* - State: 'aceitaTermos' armazena o booleano reativo.          */}
          {/* - Prop: 'value' recebe o valor do State e envia ao Switch.    */}
          {/* - Evento: 'onValueChange' é a Prop que recebe a função        */}
          {/*   setAceitaTermos, invocada pelo React Native na interação.   */}
          {/* ============================================================= */}
          <View style={styles.switchContainer}>
            <Switch
              value={aceitaTermos}
              onValueChange={setAceitaTermos}
              trackColor={{ false: "#d1d5db", true: "#0a7ea4" }}
              thumbColor={aceitaTermos ? "#ffffff" : "#f4f3f4"}
            />
            <Text style={styles.switchTexto}>
              {aceitaTermos ? "Termos aceitos" : "Termos não aceitos"}
            </Text>
          </View>

          {/* Mensagem observável do evento onPress (Etapa 2) */}
          {statusMensagem ? (
            <Text style={styles.statusMensagem}>{statusMensagem}</Text>
          ) : null}

          {/* ============================================================= */}
          {/* ETAPA 9: RELAÇÃO ENTRE PROPS E EVENTOS NO BUTTON              */}
          {/* - Prop: 'title' passa o texto do botão para o componente.     */}
          {/* - Prop de Evento: 'onPress' recebe a função handleSave.       */}
          {/* - Função: 'handleSave' é executada quando o toque ocorre.     */}
          {/* ============================================================= */}
          <View style={styles.acoesContainer}>
            <Button
              title="Cadastrar"
              onPress={handleSave}
              color="#0a7ea4"
            />
            <Button
              title="Limpar Campos"
              onPress={handleLimpar}
              color="#6b7280"
            />
          </View>

          {/* Componente Pressable com onPress e onLongPress (Etapa 3) */}
          <Pressable
            style={({ pressed }) => [
              styles.pressableArea,
              pressed && styles.pressablePressed,
            ]}
            onPress={handlePress}
            onLongPress={handleLongPress}
          >
            <Text style={styles.pressableText}>Pressione ou segure aqui (Pressable)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 36,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusMensagem: {
    textAlign: "center",
    color: "#0a7ea4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  acoesContainer: {
    marginTop: 12,
    gap: 10,
  },
  pressableArea: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#0a7ea4",
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  pressablePressed: {
    backgroundColor: "#e0f2fe",
  },
  pressableText: {
    color: "#0a7ea4",
    fontSize: 14,
    fontWeight: "600",
  },
  previewTexto: {
    fontSize: 13,
    color: "#059669",
    backgroundColor: "#ecfdf5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontWeight: "500",
  },
  focoIndicador: {
    fontSize: 13,
    color: "#0284c7",
    backgroundColor: "#e0f2fe",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontWeight: "600",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  switchTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});
