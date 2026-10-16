// Dev-only catalog of every design-system component. NOT exported from the DS barrel.
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AuthBackdrop,
  AuthCard,
  Avatar,
  BackButton,
  Badge,
  BadgeTone,
  BootSplash,
  Button,
  ButtonSize,
  ButtonVariant,
  CategoryTile,
  Card,
  Chip,
  Divider,
  dialog,
  EmptyState,
  FONT_FAMILY,
  FullScreenModal,
  GRADIENTS,
  IconCircle,
  IconCircleVariant,
  Input,
  ListRow,
  NoticeBanner,
  NoticeBannerVariant,
  OtpInput,
  PathCard,
  ProgressBar,
  ReasonDialog,
  RequestRow,
  ReportSheet,
  ScreenHeader,
  SectionHeader,
  ScreenLoader,
  ServiceCard,
  Skeleton,
  SkeletonList,
  SkeletonRow,
  SPACING,
  StatTile,
  StepCard,
  SummaryCard,
  StepTimeline,
  Text,
  TOKENS,
  TrustRow,
  TYPE_SCALE,
  toast,
  usePremiumColors,
  ValueHero,
  useThemeColors,
} from '@/core/design-system';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'dangerOutline'];
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const BADGE_TONES: BadgeTone[] = [...(Object.keys(TOKENS.status) as BadgeTone[]), 'brand', 'neutral'];
const NOTICE_VARIANTS: NoticeBannerVariant[] = ['info', 'trust', 'error', 'pending'];
const ICON_VARIANTS: IconCircleVariant[] = ['neutral', 'brand', 'success', 'danger'];
const TYPE_KEYS = Object.keys(TYPE_SCALE) as (keyof typeof TYPE_SCALE)[];
const AVATAR_URI = 'https://picsum.photos/200';
const REPORT_REASONS = [
  { code: 'spam', label: 'Spam' },
  { code: 'abuse', label: 'Contenido ofensivo' },
  { code: 'other', label: 'Otro' },
];

function Section({ name, children }: { name: string; children: React.ReactNode }) {
  const tc = useThemeColors();
  return (
    <View style={styles.section}>
      <Text variant="meta" color={tc.signal}>{`<${name} />`}</Text>
      <SectionHeader title={name} actionLabel="" />
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Label({ children }: { children: string }) {
  const tc = useThemeColors();
  return <Text variant="caption" color={tc.textSub}>{children}</Text>;
}

function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

function Swatch({ name, color }: { name: string; color: string }) {
  const tc = useThemeColors();
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchBox, { backgroundColor: color, borderColor: tc.border }]} />
      <Text variant="caption" color={tc.textSub} numberOfLines={1}>{name}</Text>
    </View>
  );
}

function Foundations() {
  const tc = useThemeColors();
  const pc = usePremiumColors();
  const tcEntries = Object.entries(tc).filter(([, v]) => typeof v === 'string') as [string, string][];
  const pcEntries = Object.entries(pc).filter(([, v]) => typeof v === 'string') as [string, string][];
  const gradients = Object.entries(GRADIENTS).filter(([, v]) => Array.isArray(v)) as [string, readonly string[]][];
  return (
    <>
      <Section name="Theme">
        <Row><ThemeToggle /></Row>
      </Section>
      <Section name="useThemeColors (tc.*)">
        <Row>{tcEntries.map(([k, v]) => <Swatch key={k} name={k} color={v} />)}</Row>
      </Section>
      <Section name="GRADIENTS">
        {gradients.map(([k, colors]) => (
          <View key={k} style={styles.gap}>
            <Label>{k}</Label>
            <LinearGradient colors={colors as unknown as [string, string, ...string[]]} style={styles.gradient} />
          </View>
        ))}
      </Section>
      <Section name="SPACING">
        {Object.entries(SPACING).map(([k, v]) => (
          <Row key={k}>
            <View style={[styles.spaceBar, { width: v, backgroundColor: tc.signal }]} />
            <Label>{`${k} · ${v}`}</Label>
          </Row>
        ))}
      </Section>
      <Section name="usePremiumColors (pc.*)">
        <Row>{pcEntries.map(([k, v]) => <Swatch key={k} name={k} color={v} />)}</Row>
      </Section>
    </>
  );
}

function TextSection() {
  const tc = useThemeColors();
  return (
    <Section name="Text">
      {TYPE_KEYS.map((k) => (
        <View key={k} style={styles.gap}>
          <Label>{k}</Label>
          <Text variant={k}>Servicio profesional Bosko</Text>
        </View>
      ))}
      <Text color={tc.textSub}>color=textSub</Text>
      <Text center>center</Text>
      <Text style={{ fontFamily: FONT_FAMILY.mono }}>mono</Text>
    </Section>
  );
}

function ButtonSection() {
  const tc = useThemeColors();
  const icon = <Ionicons name="add" size={18} color={tc.text} />;
  return (
    <Section name="Button">
      {BUTTON_VARIANTS.map((v) => (
        <View key={v} style={styles.gap}>
          <Label>{v}</Label>
          <Row>
            {BUTTON_SIZES.map((s) => <Button key={s} label={s} variant={v} size={s} onPress={() => {}} />)}
          </Row>
          <Row>
            <Button label="Loading" variant={v} loading />
            <Button label="Disabled" variant={v} disabled />
            <Button label="Icon L" variant={v} icon={icon} onPress={() => {}} />
            <Button label="Icon R" variant={v} icon={icon} iconPosition="right" onPress={() => {}} />
          </Row>
        </View>
      ))}
      <Button label="fullWidth" fullWidth onPress={() => {}} />
    </Section>
  );
}

function BadgeChipAvatarSection() {
  const [sel, setSel] = useState<string[]>(['a']);
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <>
      <Section name="Badge">
        <Row>{BADGE_TONES.map((t) => <Badge key={t} label={t} tone={t} />)}</Row>
        <Row>{BADGE_TONES.map((t) => <Badge key={t} label={t} tone={t} size="sm" icon="checkmark" />)}</Row>
      </Section>
      <Section name="Chip">
        <Row>
          <Chip label="Seleccionado" selected />
          <Chip label="Sin seleccionar" />
          <Chip label="Con icono" icon="star-outline" />
          <Chip label="Disabled" disabled />
        </Row>
        <Row>
          {['a', 'b', 'c'].map((k) => (
            <Chip key={k} label={`Toggle ${k}`} selected={sel.includes(k)} onPress={() => toggle(k)} />
          ))}
        </Row>
      </Section>
      <Section name="Avatar">
        <Row>
          <Avatar uri={AVATAR_URI} name="Ana" />
          <Avatar name="Bruno" />
          <Avatar />
          <Avatar name="Carla" online />
          <Avatar uri={AVATAR_URI} online />
        </Row>
        <Row>
          {[24, 40, 52, 72, 96].map((s) => <Avatar key={s} name="Dani" size={s} />)}
        </Row>
      </Section>
    </>
  );
}

function InputSection() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [otp, setOtp] = useState('');
  return (
    <>
      <Section name="Input">
        <Input label="Default" placeholder="Escribe algo" value={a} onChangeText={setA} />
        <Input label="Con iconos" placeholder="Buscar" leftIcon="search-outline" rightIcon="close-circle" />
        <Input label="Error" placeholder="Email" value={b} onChangeText={setB} error="Campo requerido" />
        <Input label="Password" placeholder="Contrasena" secureTextEntry value={c} onChangeText={setC} />
        <Input label="Multiline" placeholder="Descripcion" multiline />
        <Input label="Disabled" placeholder="No editable" editable={false} />
      </Section>
      <Section name="OtpInput">
        <OtpInput label="Codigo" value={otp} onChange={setOtp} />
        <OtpInput label="Con error" value="123" onChange={() => {}} error="Codigo invalido" length={4} />
      </Section>
    </>
  );
}

function FeedbackSection() {
  return (
    <>
      <Section name="NoticeBanner">
        {NOTICE_VARIANTS.map((v) => (
          <NoticeBanner key={v} variant={v}>{`Variante ${v}: mensaje de ejemplo para revisar el estilo.`}</NoticeBanner>
        ))}
        <NoticeBanner icon="star">Icono personalizado</NoticeBanner>
      </Section>
      <Section name="Skeleton / SkeletonRow">
        <Skeleton />
        <Skeleton width={160} height={20} radius={TOKENS.radius.sm} />
        <SkeletonRow />
        <SkeletonRow />
      </Section>
      <Section name="SkeletonList">
        <SkeletonList variant="row" count={2} />
        <SkeletonList variant="card" count={2} />
      </Section>
      <Section name="ScreenLoader">
        <View style={styles.fixed}><ScreenLoader label="Cargando" /></View>
      </Section>
      <Section name="ProgressBar">
        {[0, 50, 100].map((v) => (
          <View key={v} style={styles.gap}>
            <Label>{`${v}%`}</Label>
            <ProgressBar value={v} />
          </View>
        ))}
      </Section>
      <Section name="Toast / ToastRoot / toast">
        <Row>
          <Button label="success" size="sm" onPress={() => toast.success('Listo', 'Se guardo correctamente')} />
          <Button label="error" size="sm" variant="danger" onPress={() => toast.error('Error', 'Algo salio mal')} />
          <Button label="warning" size="sm" variant="secondary" onPress={() => toast.warning('Atencion', 'Revisa los datos')} />
        </Row>
      </Section>
    </>
  );
}

function LayoutSection() {
  const [pressed, setPressed] = useState(0);
  return (
    <>
      <Section name="Card">
        <Card><Text>Plain (bordered)</Text></Card>
        <Card bordered={false}><Text>Sin borde</Text></Card>
        <Card elevated><Text>Elevated</Text></Card>
        <Card onPress={() => setPressed((p) => p + 1)}><Text>{`Pressable (${pressed})`}</Text></Card>
        <Card padding="xxl" radius="xl"><Text>padding xxl / radius xl</Text></Card>
      </Section>
      <Section name="Divider">
        <Divider />
        <Row style={styles.dividerRow}><Text>A</Text><Divider vertical /><Text>B</Text></Row>
      </Section>
      <Section name="SectionHeader">
        <SectionHeader title="Sin accion" />
        <SectionHeader title="Con accion" actionLabel="Ver todo" onActionPress={() => {}} />
      </Section>
      <Section name="ScreenHeader">
        <ScreenHeader title="Solo titulo" />
        <ScreenHeader title="Con back" onBack={() => {}} />
        <ScreenHeader title="Con right" onBack={() => {}} right={<Ionicons name="ellipsis-horizontal" size={20} />} />
        <ScreenHeader variant="large" title="Large" subtitle="Subtitulo opcional" />
        <ScreenHeader variant="large" title="Large + back" onBack={() => {}} right={<Ionicons name="add" size={22} />} />
        <View style={styles.fixed}><LinearGradient colors={GRADIENTS.brandDeep} style={styles.center}><ScreenHeader tone="onBrand" title="On brand" onBack={() => {}} /></LinearGradient></View>
      </Section>
      <Section name="BackButton">
        <BackButton onPress={() => {}} />
      </Section>
      <Section name="ListRow">
        <ListRow label="Plano" onPress={() => {}} />
        <ListRow label="Con icono" icon="person-outline" onPress={() => {}} />
        <ListRow label="Con subtitulo" subtitle="Detalle secundario" icon="mail-outline" onPress={() => {}} />
        <ListRow label="Danger" icon="trash-outline" danger onPress={() => {}} />
        <ListRow label="Right slot" icon="notifications-outline" hideChevron right={<Badge label="Nuevo" tone="brand" size="sm" />} />
      </Section>
      <Section name="IconCircle">
        <Row>
          {ICON_VARIANTS.map((v) => <IconCircle key={v} name="checkmark" variant={v} size={64} />)}
        </Row>
      </Section>
      <Section name="EmptyState">
        <View style={styles.fixed}>
          <EmptyState
            icon="albums-outline"
            title="Nada por aqui"
            subtitle="Cuando haya contenido aparecera en este lugar."
            cta={{ label: 'Accion principal', onPress: () => {} }}
            secondaryCta={{ label: 'Accion secundaria', onPress: () => {} }}
          />
        </View>
      </Section>
      <Section name="StepTimeline">
        <StepTimeline
          steps={[
            { label: 'Solicitud enviada', status: 'done', icon: 'paper-plane-outline' },
            { label: 'En revision', status: 'active', icon: 'time-outline' },
            { label: 'Completado', status: 'pending', icon: 'checkmark-done-outline' },
          ]}
        />
      </Section>
    </>
  );
}

const SPLASH_DEMO_MS = 3000;

function BootSplashDemo() {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setReady(true), SPLASH_DEMO_MS);
    return () => clearTimeout(timer);
  }, [playing]);

  return (
    <Section name="BootSplash">
      <Button
        label="Reproducir splash (3 s)"
        variant="secondary"
        onPress={() => {
          setReady(false);
          setPlaying(true);
        }}
      />
      {playing && (
        <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => setReady(true)}>
          <BootSplash ready={ready} onHidden={() => setPlaying(false)} />
        </Modal>
      )}
    </Section>
  );
}

function AuthSection() {
  return (
    <>
      <BootSplashDemo />
      <Section name="AuthBackdrop">
        <View style={styles.fixed}><AuthBackdrop><View /></AuthBackdrop></View>
      </Section>
      <Section name="AuthCard">
        <View style={styles.fixedTall}>
          <AuthBackdrop>
            <View style={styles.center}>
              <AuthCard><Text variant="title">Iniciar sesion</Text><Text>Contenido de la tarjeta</Text></AuthCard>
            </View>
          </AuthBackdrop>
        </View>
      </Section>
    </>
  );
}

function ModalSection() {
  const [full, setFull] = useState(false);
  const [reason, setReason] = useState(false);
  const [report, setReport] = useState(false);
  const tc = useThemeColors();
  return (
    <>
      <Section name="FullScreenModal">
        <Button label="Abrir" variant="secondary" onPress={() => setFull(true)} />
        <FullScreenModal visible={full} onRequestClose={() => setFull(false)}>
          <View style={[styles.modalFill, { backgroundColor: tc.bg }]}>
            <Text>FullScreenModal</Text>
            <Button label="Cerrar" onPress={() => setFull(false)} />
          </View>
        </FullScreenModal>
      </Section>
      <Section name="ConfirmDialog / dialog">
        <Row>
          <Button label="alert" size="sm" variant="secondary" onPress={() => dialog.alert({ title: 'Listo', message: 'Se guardo correctamente' }).then(() => toast.success('alert cerrado'))} />
          <Button label="confirm" size="sm" onPress={() => dialog.confirm({ title: 'Publicar servicio', message: 'Quedara visible para todos.' }).then((ok) => toast.success(`confirm: ${ok}`))} />
          <Button label="destructive" size="sm" variant="danger" onPress={() => dialog.confirm({ title: 'Eliminar', message: 'Esta accion no se puede deshacer.', confirmLabel: 'Eliminar', destructive: true }).then((ok) => toast.success(`destructive: ${ok}`))} />
          <Button
            label="choose (3)"
            size="sm"
            variant="outline"
            onPress={() =>
              dialog
                .choose({
                  title: 'Subir documento',
                  message: 'Elegi como adjuntarlo',
                  actions: [
                    { key: 'file', label: 'Desde archivos' },
                    { key: 'camera', label: 'Tomar foto' },
                    { key: 'cancel', label: 'Cancelar', style: 'cancel' },
                  ],
                })
                .then((key) => toast.success(`choose: ${key ?? 'null'}`))
            }
          />
        </Row>
      </Section>
      <Section name="ReasonDialog">
        <Button label="Abrir" variant="secondary" onPress={() => setReason(true)} />
        <ReasonDialog
          visible={reason}
          title="Cancelar orden"
          message="Indica el motivo de la cancelacion."
          placeholder="Motivo"
          confirmLabel="Confirmar"
          onCancel={() => setReason(false)}
          onConfirm={() => setReason(false)}
        />
      </Section>
      <Section name="ReportSheet">
        <Button label="Abrir" variant="secondary" onPress={() => setReport(true)} />
        <ReportSheet
          visible={report}
          title="Reportar"
          message="Cuentanos que paso."
          reasons={REPORT_REASONS}
          otherCode="other"
          onCancel={() => setReport(false)}
          onSubmit={() => setReport(false)}
        />
      </Section>
    </>
  );
}

function HomeSection() {
  const [fav, setFav] = useState(false);
  return (
    <>
      <Section name="ServiceCard">
        <Row style={styles.cardRow}>
          <ServiceCard
            style={styles.half}
            title="Instalación de tomas y tableros"
            category="Electricidad"
            location="Palermo"
            rating={4.8}
            reviewsCount={32}
            price="$18.500"
            isAvailable
            isFavorite={fav}
            onToggleFavorite={() => setFav((v) => !v)}
            onPress={() => {}}
          />
          <ServiceCard
            style={styles.half}
            title="Pintura de interiores"
            fallbackIcon="brush-outline"
            category="Pintura"
            location="Caballito"
            price="Consultar"
            onPress={() => {}}
          />
        </Row>
      </Section>
      <Section name="ValueHero">
        <ValueHero
          eyebrow="Servicios en red · ARG"
          title="Encontrá quien lo haga. O hacelo vos."
          body="Bosko conecta a quienes necesitan un trabajo con quienes saben hacerlo, cerca tuyo."
          searchPlaceholder="¿Qué necesitás? Electricista, pintor…"
          onSearchPress={() => {}}
        />
      </Section>
      <Section name="PathCard">
        <Row style={styles.cardRow}>
          <PathCard icon="search-outline" title="Contratar" description="Profesionales verificados con reseñas reales." linkLabel="Buscar servicios →" onPress={() => {}} />
          <PathCard icon="construct-outline" title="Ofrecer" description="Publicá tus servicios y conseguí clientes." linkLabel="Empezar a ofrecer →" onPress={() => {}} />
        </Row>
      </Section>
      <Section name="StepCard">
        <Row style={styles.cardRow}>
          <StepCard number="01" title="Buscá" caption="Por rubro o zona" />
          <StepCard number="02" title="Pedí presupuesto" caption="Por chat, sin cargo" />
          <StepCard number="03" title="Coordiná y calificá" caption="Todo en la orden" />
        </Row>
      </Section>
      <Section name="TrustRow">
        <TrustRow icon="shield-checkmark-outline" title="Identidad verificada" caption="Los profesionales validan su identidad y antecedentes" />
        <TrustRow icon="star-outline" title="Reseñas reales" caption="Solo califica quien contrató el servicio" />
      </Section>
      <Section name="CategoryTile">
        <Row style={styles.cardRow}>
          <CategoryTile icon="flash-outline" label="Electricidad" onPress={() => {}} />
          <CategoryTile icon="water-outline" label="Plomería" onPress={() => {}} />
          <CategoryTile icon="color-palette-outline" label="Pintura" onPress={() => {}} />
          <CategoryTile icon="leaf-outline" label="Jardín" onPress={() => {}} />
        </Row>
      </Section>
      <Section name="SummaryCard">
        <SummaryCard eyebrow="Hola, Martín" title="Tenés 2 solicitudes nuevas" actionLabel="Ver solicitudes" onAction={() => {}} />
      </Section>
      <Section name="RequestRow">
        <RequestRow name="Laura P." title="Laura P. · Instalación de tomas" subtitle="Palermo · Sábado por la mañana" badge="Nueva" onPress={() => {}} />
      </Section>
      <Section name="StatTile">
        <Row style={styles.cardRow}>
          <StatTile value="4.8" label="Rating" />
          <StatTile value="128" label="Trabajos" />
        </Row>
      </Section>
    </>
  );
}

export function ComponentShowcase() {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.giant }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h2">Component showcase</Text>
        <Foundations />
        <TextSection />
        <ButtonSection />
        <BadgeChipAvatarSection />
        <InputSection />
        <FeedbackSection />
        <LayoutSection />
        <HomeSection />
        <AuthSection />
        <ModalSection />
      </ScrollView>
    </View>
  );
}

export default ComponentShowcase;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.xxl },
  section: { gap: SPACING.sm },
  sectionBody: { gap: SPACING.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, alignItems: 'center' },
  cardRow: { flexWrap: 'nowrap', alignItems: 'stretch' },
  half: { flex: 1 },
  gap: { gap: SPACING.xs },
  swatch: { width: 72, gap: SPACING.xs },
  swatchBox: { height: 40, borderRadius: TOKENS.radius.sm, borderWidth: 1 },
  gradient: { height: 32, borderRadius: TOKENS.radius.sm },
  spaceBar: { height: SPACING.md, borderRadius: SPACING.xs },
  dividerRow: { height: SPACING.xxl },
  fixed: { height: 260, borderRadius: TOKENS.radius.md, overflow: 'hidden' },
  fixedTall: { height: 320, borderRadius: TOKENS.radius.md, overflow: 'hidden' },
  center: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  modalFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
});
