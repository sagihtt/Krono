import { KronoLogo } from '@/components/KronoLogo';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { PerfilColaborador, PontoRegistro } from '@/models/ponto';
import {
  carregarPerfilStorage,
  carregarPontosStorage,
  carregarPreferenciasStorage,
  salvarPreferenciasStorage,
} from '@/services/storageService';
import Feather from '@expo/vector-icons/Feather';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

interface AppShellProps {
  title: string;
  subtitle?: string;
  onlineStatus?: boolean;
  onRefresh?: () => void;
  modoCompacto?: boolean;
  onToggleCompacto?: (val: boolean) => void;
  showBackButton?: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Registro de ponto',
    path: '/',
    match: ['/', '/index'],
    icon: 'clock' as const,
  },
  {
    label: 'Documentos e anexos',
    path: '/explore',
    match: ['/explore'],
    icon: 'folder' as const,
  },
  {
    label: 'Meu perfil',
    path: '/cadastro',
    match: ['/cadastro'],
    icon: 'user' as const,
  },
];

export function AppShell({
  title,
  subtitle,
  onlineStatus = false,
  onRefresh,
  modoCompacto: modoCompactoProp,
  onToggleCompacto,
  showBackButton = false,
  children,
}: AppShellProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const isSmallMobile = width < 390;
  const router = useRouter();
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slideAnim] = useState(() => new Animated.Value(-310));

  const [perfil, setPerfil] = useState<PerfilColaborador | null>(null);
  const [recentes, setRecentes] = useState<PontoRegistro[]>([]);
  const [compactoInterno, setCompactoInterno] = useState(false);

  const modoCompacto = modoCompactoProp ?? compactoInterno;

  const carregarResumoMenu = useCallback(async () => {
    try {
      const [p, pts, prefs] = await Promise.all([
        carregarPerfilStorage(),
        carregarPontosStorage(),
        carregarPreferenciasStorage(),
      ]);
      setPerfil(p);
      setRecentes(pts.slice(0, 4));
      setCompactoInterno(prefs.modoCompacto);
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      carregarPerfilStorage(),
      carregarPontosStorage(),
      carregarPreferenciasStorage(),
    ])
      .then(([p, pts, prefs]) => {
        if (!ativo) return;
        setPerfil(p);
        setRecentes(pts.slice(0, 4));
        setCompactoInterno(prefs.modoCompacto);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [pathname]);

  const abrirDrawer = () => {
    carregarResumoMenu();
    setDrawerOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      speed: 22,
      bounciness: 4,
    }).start();
  };

  const fecharDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -310,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setDrawerOpen(false));
  };

  const navegarPara = (rota: string) => {
    fecharDrawer();
    router.push(rota as any);
  };

  const voltarOuIrInicio = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleToggleCompacto = async (val: boolean) => {
    setCompactoInterno(val);
    if (onToggleCompacto) {
      onToggleCompacto(val);
    } else {
      const prefs = await carregarPreferenciasStorage();
      await salvarPreferenciasStorage({ ...prefs, modoCompacto: val });
    }
  };

  const iniciais = perfil?.nome
    ? perfil.nome
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'TC';

  const renderMenuContent = (inModal: boolean) => (
    <View style={[styles.sidebarInner, inModal && styles.sidebarInnerModal]}>
      <View style={styles.brandHeader}>
        <View style={styles.brandIdentity}>
          <KronoLogo size={30} />
          <Text style={styles.brandTitle}>Krono</Text>
        </View>

        {inModal && (
          <TouchableOpacity
            onPress={fecharDrawer}
            style={styles.iconCircleBtn}
            accessibilityLabel="Fechar menu"
          >
            <Feather name="x" size={18} color={AntigravityPalette.obsidian} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.navGroup}>
        <Text style={styles.drawerSectionLabel}>NAVEGAÇÃO</Text>
        {NAV_ITEMS.map((item) => {
          const isActive = item.match.includes(pathname);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navegarPara(item.path)}
              activeOpacity={0.75}
            >
              <Feather
                name={item.icon}
                size={18}
                color={
                  isActive
                    ? AntigravityPalette.obsidian
                    : AntigravityPalette.slate
                }
              />
              <Text
                style={[
                  styles.navItemText,
                  isActive && styles.navItemTextActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.drawerSectionLabel}>REGISTROS RECENTES</Text>
        <ScrollView
          style={styles.recentList}
          showsVerticalScrollIndicator={false}
        >
          {recentes.map((reg) => (
            <TouchableOpacity
              key={reg.id}
              style={styles.recentItem}
              onPress={() => navegarPara(`/detalhes/${reg.id}`)}
            >
              <View style={styles.recentDot} />
              <View style={styles.recentTextCol}>
                <Text style={styles.recentItemTitle} numberOfLines={1}>
                  {reg.categoria}
                </Text>
                <Text style={styles.recentItemSub} numberOfLines={1}>
                  {reg.dataHora}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={14}
                color={AntigravityPalette.muted}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.personalizationBox}>
        <View style={styles.prefRow}>
          <View style={styles.prefLabelGroup}>
            <Feather
              name="sliders"
              size={15}
              color={AntigravityPalette.slate}
            />
            <Text style={styles.prefLabelText}>Lista compacta</Text>
          </View>
          <Switch
            value={modoCompacto}
            onValueChange={handleToggleCompacto}
            trackColor={{
              false: AntigravityPalette.border,
              true: AntigravityPalette.obsidian,
            }}
            thumbColor={AntigravityPalette.canvas}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.profileFooter}
        onPress={() => navegarPara('/cadastro')}
        activeOpacity={0.8}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.profileName} numberOfLines={1}>
            {perfil?.nome || 'Colaborador'}
          </Text>
          <Text style={styles.profileRole} numberOfLines={1}>
            {perfil?.cargo || 'Configurar perfil'}
          </Text>
        </View>
        <Feather
          name="settings"
          size={16}
          color={AntigravityPalette.muted}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      {isDesktop && (
        <View style={styles.desktopSidebar}>{renderMenuContent(false)}</View>
      )}

      <View style={styles.mainColumn}>
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <View style={styles.topBarLeft}>
              {showBackButton ? (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={voltarOuIrInicio}
                  accessibilityLabel="Voltar"
                >
                  <Feather
                    name="arrow-left"
                    size={19}
                    color={AntigravityPalette.obsidian}
                  />
                </TouchableOpacity>
              ) : !isDesktop ? (
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={abrirDrawer}
                  accessibilityLabel="Abrir menu lateral"
                >
                  <Feather
                    name="menu"
                    size={20}
                    color={AntigravityPalette.obsidian}
                  />
                </TouchableOpacity>
              ) : null}

              <View style={styles.topBarTextCol}>
                <Text style={styles.screenTitle} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && !isSmallMobile ? (
                  <Text style={styles.screenSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.topBarRight}>
              {onRefresh && (
                <TouchableOpacity
                  style={styles.syncPill}
                  onPress={onRefresh}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.syncDot,
                      {
                        backgroundColor: onlineStatus
                          ? AntigravityPalette.emerald
                          : AntigravityPalette.muted,
                      },
                    ]}
                  />
                  <Text style={styles.syncText} numberOfLines={1}>
                    {onlineStatus ? 'Sincronizado' : 'Local'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.topAvatarBtn}
                onPress={() => router.push('/cadastro')}
              >
                <Text style={styles.topAvatarText}>{iniciais}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>{children}</View>
      </View>

      {!isDesktop && (
        <Modal
          visible={drawerOpen}
          transparent
          animationType="none"
          onRequestClose={fecharDrawer}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.backdrop} onPress={fecharDrawer} />
            <Animated.View
              style={[
                styles.drawerSheet,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {renderMenuContent(true)}
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: AntigravityPalette.canvas,
  },
  desktopSidebar: {
    width: 268,
    borderRightWidth: 1,
    borderRightColor: AntigravityPalette.border,
    backgroundColor: AntigravityPalette.surface,
  },
  sidebarInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 52,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  sidebarInnerModal: {
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  brandIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.5,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AntigravityPalette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGroup: {
    gap: 4,
  },
  drawerSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.muted,
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  navItemActive: {
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  navItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: AntigravityPalette.slate,
  },
  navItemTextActive: {
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  recentSection: {
    flex: 1,
    marginTop: 22,
  },
  recentList: {
    marginTop: 4,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AntigravityPalette.electricBlue,
  },
  recentTextCol: {
    flex: 1,
    minWidth: 0,
  },
  recentItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: AntigravityPalette.obsidian,
  },
  recentItemSub: {
    fontSize: 11,
    color: AntigravityPalette.muted,
    marginTop: 1,
  },
  personalizationBox: {
    borderTopWidth: 1,
    borderTopColor: AntigravityPalette.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  prefLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  prefLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: AntigravityPalette.slate,
  },
  profileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AntigravityPalette.canvas,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AntigravityPalette.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: AntigravityPalette.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  profileRole: {
    fontSize: 11,
    color: AntigravityPalette.muted,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AntigravityPalette.canvas,
  },
  topBar: {
    paddingTop: Platform.OS === 'web' ? 14 : 46,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AntigravityPalette.border,
    backgroundColor: AntigravityPalette.canvas,
  },
  topBarInner: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  topBarTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AntigravityPalette.surface,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: AntigravityPalette.muted,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.slate,
  },
  topAvatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AntigravityPalette.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topAvatarText: {
    color: AntigravityPalette.canvas,
    fontSize: 12,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(18, 19, 23, 0.38)',
  },
  drawerSheet: {
    width: 286,
    maxWidth: '84%',
    height: '100%',
    backgroundColor: AntigravityPalette.surface,
    borderRightWidth: 1,
    borderRightColor: AntigravityPalette.border,
  },
});
