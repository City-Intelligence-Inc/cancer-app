import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  StyleSheet, ActivityIndicator, Linking, Dimensions, Platform, Image,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSession } from "../context/SessionContext";
import { getSheetCities, getSheetCityCountryMap, getSheetDiagnoses, getAllResources } from "../services/api";
import { Resource } from "../data/resources";

// ─── Tokens ──────────────────────────────────────────────────────────

const ORANGE  = "#F47B4B";
const YELLOW  = "#F7C548";
const CREAM   = "#F9F2E7";
const WHITE   = "#FFFFFF";
const L1      = "#1C1C1E";   // primary label
const L2      = "#6C6C70";   // secondary label
const L3      = "#AEAEB2";   // tertiary label
const SEP     = "#E5E5EA";
const FILL    = "#F2F2F7";
const WARM    = "#5B3A29";

const W        = Dimensions.get("window").width;
const H_PAD    = 20;
const CARD_W   = Math.round(W * 0.74);
const NAV_H    = 60;

// ─── Cancer types (comprehensive hardcoded list) ───────────────────

const ALL_DIAGNOSES = [
  "Bladder Cancer", "Blood / Leukaemia", "Bowel / Colorectal Cancer",
  "Brain Cancer", "Breast Cancer", "Gynaecological Cancer",
  "Head & Neck Cancer", "Kidney Cancer", "Liver Cancer", "Lung Cancer",
  "Lymphoma", "Mesothelioma", "Myeloma", "Ovarian Cancer",
  "Pancreatic Cancer", "Prostate Cancer", "Sarcoma", "Skin Cancer",
  "Thyroid Cancer", "Other / Unsure",
];

// ─── Category config ─────────────────────────────────────────────────

interface CatMeta { label: string; accent: string }
const CATS: Record<string, CatMeta> = {
  "Mental Health":           { label: "Mental Health",     accent: "#C0392B" },
  "Peer Support":            { label: "Peer Support",      accent: "#1A7A6E" },
  "Financial Aid":           { label: "Financial Support", accent: "#9A7000" },
  "Practical Help":          { label: "Practical Help",    accent: "#C85E20" },
  "Legal & Employment":      { label: "Legal & Work",      accent: "#4A3FAA" },
  "Information & Education": { label: "Information",       accent: "#0066BB" },
  "Carer Support":           { label: "Carer Support",     accent: "#1A7A6E" },
  "Wellness & Nutrition":    { label: "Wellness",          accent: "#2E7D32" },
  "End-of-Life Care":        { label: "End of Life",       accent: "#5D4037" },
};
const CAT_ORDER = [
  "Mental Health", "Peer Support", "Financial Aid", "Practical Help",
  "Information & Education", "Carer Support", "Wellness & Nutrition",
  "Legal & Employment", "End-of-Life Care",
];

// ─── Types ────────────────────────────────────────────────────────────

interface UserProfile { city: string; country: string; zipcode: string; diagnosis: string }
type Tab = "home" | "search" | "profile";

// ─── Onboarding ──────────────────────────────────────────────────────

function Onboarding({ onDone }: { onDone: (p: UserProfile) => void }) {
  const insets = useSafeAreaInsets();
  const H = Dimensions.get("window").height;

  const [step, setStep] = useState<"welcome" | "city" | "diagnosis" | "postcode">("welcome");
  const [cityQ,    setCityQ]    = useState("");
  const [cities,   setCities]   = useState<string[]>([]);
  const [city,     setCity]     = useState<string | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});

  const [diagQ,    setDiagQ]    = useState("");
  const [sheetDiags, setSheetDiags] = useState<string[]>([]);
  const [diagsLoading, setDiagsLoading] = useState(false);
  const [diag,     setDiag]     = useState<string | null>(null);

  const [zip,      setZip]      = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const handleUseLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoError("Location access denied. Please search for your city.");
        setGeoLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const detectedCity = geo?.city || geo?.subregion || geo?.region || "";
      if (detectedCity) {
        const exact = cities.find(c => c.toLowerCase() === detectedCity.toLowerCase());
        if (exact) {
          setCity(exact);
          setCityQ(exact);
          setStep("diagnosis");
        } else {
          const partial = cities.find(c =>
            c.toLowerCase().includes(detectedCity.toLowerCase()) ||
            detectedCity.toLowerCase().includes(c.toLowerCase())
          );
          if (partial) {
            setCity(partial);
            setCityQ(partial);
            setStep("diagnosis");
          } else {
            setCityQ(detectedCity);
            setGeoError(`Found "${detectedCity}" — pick the closest match below.`);
          }
        }
        if (geo?.postalCode) setZip(geo.postalCode);
      } else {
        setGeoError("Couldn't detect your city. Please search manually.");
      }
    } catch {
      setGeoError("Couldn't get location. Please search for your city.");
    } finally {
      setGeoLoading(false);
    }
  }, [cities]);

  const allDiags = useMemo(() => {
    const merged = new Set([...ALL_DIAGNOSES, ...sheetDiags]);
    const sorted = Array.from(merged).filter(d => d !== "Other / Unsure").sort();
    return [...sorted, "Other / Unsure"];
  }, [sheetDiags]);

  useEffect(() => {
    Promise.all([getSheetCities(), getSheetCityCountryMap()])
      .then(([c, map]) => { setCities(c); setCityCountryMap(map); })
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (!city) return;
    setDiagsLoading(true);
    getSheetDiagnoses()
      .then(setSheetDiags)
      .catch(() => {})
      .finally(() => setDiagsLoading(false));
  }, [city]);

  const citySugg = useMemo(() => {
    const q = cityQ.trim().toLowerCase();
    if (!q || city) return [];
    return cities.filter(c => c.toLowerCase().startsWith(q)).slice(0, 6);
  }, [cityQ, cities, city]);

  const diagOptions = useMemo(() => {
    const q = diagQ.trim().toLowerCase();
    if (!q) return allDiags;
    const filtered = allDiags.filter(d =>
      d !== "Other / Unsure" && d.toLowerCase().includes(q)
    );
    if (allDiags.includes("Other / Unsure")) filtered.push("Other / Unsure");
    return filtered;
  }, [diagQ, allDiags]);

  // ── Welcome screen ──
  if (step === "welcome") {
    return (
      <View style={{ flex: 1, backgroundColor: CREAM }}>
        <View style={[ob.heroBlock, { paddingTop: insets.top + 48 }]}>
          <Image
            source={require("../assets/canopy-logo.png")}
            style={{ width: 88, height: 88, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text style={ob.heroTitle}>Find support{"\n"}that fits you</Text>
          <Text style={ob.heroSub}>
            Matched to your location, diagnosis, and needs — in under 2 minutes.
          </Text>
        </View>

        <View style={ob.welcomeBody}>
          {[
            { icon: "location-outline", title: "Local to you", desc: "Resources near your city and postcode" },
            { icon: "shield-checkmark-outline", title: "Private & anonymous", desc: "No account needed, data auto-deletes" },
            { icon: "heart-outline", title: "Personalised matches", desc: "Tailored to your diagnosis and stage" },
          ].map((item, i) => (
            <View key={i} style={ob.featureRow}>
              <View style={ob.featureIcon}>
                <Ionicons name={item.icon as any} size={22} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ob.featureTitle}>{item.title}</Text>
                <Text style={ob.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 32, paddingVertical: 16 }}>
          {[["1,000+", "Resources"], ["188", "Countries"], ["700+", "Cities"]].map(([num, label]) => (
            <View key={label} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: ORANGE }}>{num}</Text>
              <Text style={{ fontSize: 11, color: L2, fontWeight: "600" }}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={[ob.welcomeFooter, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={ob.cta} onPress={() => setStep("city")} activeOpacity={0.82}>
            <Text style={ob.ctaText}>Get started</Text>
          </TouchableOpacity>
          <Text style={ob.footerNote}>Free to use, always</Text>
        </View>
      </View>
    );
  }

  // ── City step ──
  if (step === "city") {
    return (
      <View style={{ flex: 1, backgroundColor: CREAM }}>
        <View style={[ob.stepHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setStep("welcome")} hitSlop={12} style={ob.backBtn}>
            <Ionicons name="chevron-back" size={24} color={L1} />
          </TouchableOpacity>
          <View style={ob.stepDots}>
            <View style={[ob.dot, ob.dotActive]} />
            <View style={ob.dot} />
            <View style={ob.dot} />
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={ob.stepTitle}>Where are you{"\n"}located?</Text>
          <Text style={ob.stepSub}>We'll find support resources available near you.</Text>

          <TouchableOpacity
            style={[ob.locationBtn, geoLoading && { opacity: 0.5 }]}
            onPress={handleUseLocation}
            disabled={geoLoading || citiesLoading}
            activeOpacity={0.7}
          >
            {geoLoading ? (
              <View style={ob.locationBtnInner}>
                <ActivityIndicator size="small" color="#047857" />
                <Text style={ob.locationBtnText}>Finding your location...</Text>
              </View>
            ) : (
              <View style={ob.locationBtnInner}>
                <Ionicons name="navigate" size={18} color="#047857" />
                <Text style={ob.locationBtnText}>Use my location</Text>
              </View>
            )}
          </TouchableOpacity>

          {geoError ? <Text style={ob.geoError}>{geoError}</Text> : null}

          <View style={ob.dividerRow}>
            <View style={ob.dividerLine} />
            <Text style={ob.dividerText}>or search</Text>
            <View style={ob.dividerLine} />
          </View>

          <View style={ob.field}>
            <Ionicons name="search" size={18} color={L3} style={{ marginLeft: 14 }} />
            <TextInput
              style={ob.fieldInput}
              value={cityQ}
              onChangeText={setCityQ}
              placeholder="Search for your city…"
              placeholderTextColor={L3}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
            />
            {citiesLoading && <ActivityIndicator size="small" color={ORANGE} style={{ marginRight: 12 }} />}
          </View>

          {citySugg.length > 0 && (
            <View style={ob.list}>
              {citySugg.map((c, i) => (
                <TouchableOpacity
                  key={c}
                  style={[ob.listRow, i < citySugg.length - 1 && ob.listRowBorder]}
                  onPress={() => { setCity(c); setCityQ(c); setStep("diagnosis"); }}
                  activeOpacity={0.55}
                >
                  <Ionicons name="location-outline" size={18} color={ORANGE} />
                  <Text style={ob.listRowText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Diagnosis step ──
  if (step === "diagnosis") {
    return (
      <View style={{ flex: 1, backgroundColor: CREAM }}>
        <View style={[ob.stepHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => { setStep("city"); setCity(null); setCityQ(""); }} hitSlop={12} style={ob.backBtn}>
            <Ionicons name="chevron-back" size={24} color={L1} />
          </TouchableOpacity>
          <View style={ob.stepDots}>
            <View style={[ob.dot, ob.dotDone]} />
            <View style={[ob.dot, ob.dotActive]} />
            <View style={ob.dot} />
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={ob.stepContext}>
            <Ionicons name="location" size={14} color={ORANGE} />
            <Text style={ob.stepContextText}>{city}</Text>
          </View>
          <Text style={ob.stepTitle}>What type of{"\n"}cancer?</Text>
          <Text style={ob.stepSub}>This helps us show the most relevant resources.</Text>

          <View style={[ob.field, { marginBottom: 16 }]}>
            <Ionicons name="search" size={18} color={L3} style={{ marginLeft: 14 }} />
            <TextInput
              style={ob.fieldInput}
              value={diagQ}
              onChangeText={setDiagQ}
              placeholder="Search or pick below…"
              placeholderTextColor={L3}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {diagsLoading && <ActivityIndicator size="small" color={ORANGE} style={{ marginRight: 12 }} />}
          </View>

          <View style={ob.chipGrid}>
            {diagOptions.map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => { setDiag(d); setStep("postcode"); }}
                style={[ob.diagChip, d === "Other / Unsure" && ob.diagChipMuted]}
                activeOpacity={0.65}
              >
                <Text style={[ob.diagChipText, d === "Other / Unsure" && { color: L2 }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Postcode step ──
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: CREAM }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[ob.stepHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => { setStep("diagnosis"); setDiag(null); setDiagQ(""); }} hitSlop={12} style={ob.backBtn}>
          <Ionicons name="chevron-back" size={24} color={L1} />
        </TouchableOpacity>
        <View style={ob.stepDots}>
          <View style={[ob.dot, ob.dotDone]} />
          <View style={[ob.dot, ob.dotDone]} />
          <View style={[ob.dot, ob.dotActive]} />
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={ob.stepContext}>
          <Ionicons name="location" size={14} color={ORANGE} />
          <Text style={ob.stepContextText}>{city}</Text>
          <Text style={ob.stepContextSep}>·</Text>
          <Text style={ob.stepContextText}>{diag}</Text>
        </View>
        <Text style={ob.stepTitle}>Postcode</Text>
        <Text style={ob.stepSub}>Optional — helps us find resources even closer to you.</Text>

        <View style={ob.field}>
          <Ionicons name="mail-outline" size={18} color={L3} style={{ marginLeft: 14 }} />
          <TextInput
            style={ob.fieldInput}
            value={zip}
            onChangeText={setZip}
            placeholder="e.g. SW1A 1AA"
            placeholderTextColor={L3}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />
        </View>
      </ScrollView>

      <View style={[ob.welcomeFooter, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={ob.cta}
          onPress={() => onDone({ city: city!, country: cityCountryMap[city!] ?? "", zipcode: zip.trim(), diagnosis: diag! })}
          activeOpacity={0.82}
        >
          <Text style={ob.ctaText}>Find support</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDone({ city: city!, country: cityCountryMap[city!] ?? "", zipcode: "", diagnosis: diag! })}>
          <Text style={ob.skipText}>Skip postcode</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ob = StyleSheet.create({
  // Hero / welcome
  heroBlock:    { alignItems: "center", paddingHorizontal: H_PAD, paddingBottom: 36, backgroundColor: CREAM },
  heroTitle:    { fontSize: 34, fontWeight: "800", color: L1, textAlign: "center", lineHeight: 42, marginBottom: 12 },
  heroSub:      { fontSize: 17, color: L2, textAlign: "center", lineHeight: 25, paddingHorizontal: 16 },

  welcomeBody:  { flex: 1, paddingHorizontal: H_PAD + 4, paddingTop: 8 },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEP },
  featureIcon:  { width: 48, height: 48, borderRadius: 14, backgroundColor: "#FFF0E8", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 16, fontWeight: "700", color: L1, marginBottom: 2 },
  featureDesc:  { fontSize: 14, color: L2, lineHeight: 20 },

  welcomeFooter:{ paddingHorizontal: H_PAD, paddingTop: 16 },
  footerNote:   { fontSize: 13, color: L3, textAlign: "center", marginTop: 12 },
  skipText:     { fontSize: 15, color: ORANGE, fontWeight: "600", textAlign: "center", marginTop: 14 },

  // Step header
  stepHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingBottom: 8 },
  backBtn:      { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  stepDots:     { flexDirection: "row", gap: 8 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: SEP },
  dotActive:    { backgroundColor: ORANGE, width: 24 },
  dotDone:      { backgroundColor: ORANGE },

  stepContext:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  stepContextText: { fontSize: 14, fontWeight: "600", color: ORANGE },
  stepContextSep:  { fontSize: 14, color: L3 },
  stepTitle:    { fontSize: 30, fontWeight: "800", color: L1, lineHeight: 38, marginBottom: 8 },
  stepSub:      { fontSize: 16, color: L2, lineHeight: 23, marginBottom: 28 },

  // Shared
  label:          { fontSize: 17, fontWeight: "600", color: L1, marginBottom: 12 },
  optional:       { fontSize: 13, color: L3 },
  postcodeHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 },

  field:      { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, borderRadius: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  fieldInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 16, fontSize: 17, color: L1, paddingRight: 16 },

  list:         { marginTop: 8, backgroundColor: WHITE, borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  listRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
  listRowBorder:{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEP },
  listRowText:  { fontSize: 17, color: L1, fontWeight: "500" },

  confirmedRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  confirmedChip:    { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: ORANGE },
  confirmedChipText:{ fontSize: 15, fontWeight: "600", color: WHITE },
  change:           { fontSize: 15, color: ORANGE, fontWeight: "500" },

  chipGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  diagChip:      { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, backgroundColor: WHITE, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  diagChipMuted: { backgroundColor: FILL },
  diagChipText:  { fontSize: 15, fontWeight: "500", color: L1 },

  locationBtn:      { backgroundColor: "#ecfdf5", borderWidth: 1.5, borderColor: "#a7f3d0", borderRadius: 14, paddingVertical: 16, marginBottom: 10 },
  locationBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  locationBtnText:  { fontSize: 16, fontWeight: "600", color: "#047857" },
  geoError:         { fontSize: 13, color: "#d97706", marginBottom: 8 },
  dividerRow:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: SEP },
  dividerText:      { fontSize: 13, color: L3, fontWeight: "500" },

  cta:     { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 18, alignItems: "center", shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  ctaText: { fontSize: 18, fontWeight: "700", color: WHITE, letterSpacing: 0.3 },
});

// ─── Feed card (horizontal scroll) ───────────────────────────────────

function FeedCard({ resource, accent }: { resource: Resource; accent: string }) {
  return (
    <TouchableOpacity
      style={[fdc.card, { width: CARD_W }]}
      onPress={() => Linking.openURL(resource.url).catch(() => {})}
      activeOpacity={0.88}
    >
      <View style={[fdc.bar, { backgroundColor: accent }]} />
      <View style={fdc.body}>
        <Text style={fdc.name} numberOfLines={2}>{resource.name}</Text>
        <Text style={fdc.desc} numberOfLines={3}>{resource.description}</Text>
        <View style={fdc.footer}>
          <Text style={fdc.location}>
            {resource.entireCountry ? (resource.countries.length === 1 ? `${resource.countries[0]}-wide` : "Nationwide") : resource.cities.slice(0, 2).join(", ")}
          </Text>
          <Text style={[fdc.visitLink, { color: accent }]}>Visit ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fdc = StyleSheet.create({
  card:      { backgroundColor: WHITE, borderRadius: 16, marginRight: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  bar:       { height: 4 },
  body:      { padding: 16 },
  name:      { fontSize: 16, fontWeight: "700", color: L1, lineHeight: 22, marginBottom: 6 },
  desc:      { fontSize: 13, color: L2, lineHeight: 18, marginBottom: 14 },
  footer:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  location:  { fontSize: 12, color: L3 },
  visitLink: { fontSize: 13, fontWeight: "700" },
});

// ─── Search result card (vertical) ───────────────────────────────────

function SearchCard({ resource }: { resource: Resource }) {
  const cat    = resource.helpTypes[0] ?? null;
  const accent = cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE;
  const label  = cat ? (CATS[cat]?.label ?? cat) : null;

  return (
    <TouchableOpacity
      style={[src.card, { borderLeftColor: accent }]}
      onPress={() => Linking.openURL(resource.url).catch(() => {})}
      activeOpacity={0.88}
    >
      <View style={src.top}>
        <Text style={src.name} numberOfLines={1}>{resource.name}</Text>
        {label && <Text style={[src.catLabel, { color: accent }]}>{label}</Text>}
      </View>
      <Text style={src.desc} numberOfLines={2}>{resource.description}</Text>
      <View style={src.foot}>
        <Text style={src.loc}>{resource.entireCountry ? (resource.countries.length === 1 ? `${resource.countries[0]}-wide` : "Nationwide") : resource.cities.slice(0, 2).join(", ")}</Text>
        <Text style={[src.link, { color: accent }]}>Visit website</Text>
      </View>
    </TouchableOpacity>
  );
}

const src = StyleSheet.create({
  card: { backgroundColor: WHITE, borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  top:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 },
  name: { fontSize: 16, fontWeight: "700", color: L1, flex: 1 },
  catLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  desc: { fontSize: 14, color: L2, lineHeight: 20, marginBottom: 10 },
  foot: { flexDirection: "row", justifyContent: "space-between" },
  loc:  { fontSize: 12, color: L3 },
  link: { fontSize: 13, fontWeight: "600" },
});

// ─── Section row ─────────────────────────────────────────────────────

function SectionRow({ label, accent, resources, isFeatured }: {
  label: string; accent?: string; resources: Resource[]; isFeatured?: boolean;
}) {
  const color = accent ?? ORANGE;
  return (
    <View style={srow.wrap}>
      <View style={srow.header}>
        <Text style={srow.title}>{label}</Text>
        <Text style={[srow.count, { color }]}>{resources.length}</Text>
      </View>
      <FlatList
        horizontal
        data={resources}
        keyExtractor={r => r.id}
        renderItem={({ item }) => {
          const cat    = isFeatured ? (item.helpTypes[0] ?? null) : null;
          const itemAccent = isFeatured
            ? (cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE)
            : color;
          return <FeedCard resource={item} accent={itemAccent} />;
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: H_PAD, paddingRight: 8 }}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
      />
    </View>
  );
}

const srow = StyleSheet.create({
  wrap:   { marginBottom: 32 },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: H_PAD, marginBottom: 14 },
  title:  { fontSize: 20, fontWeight: "700", color: L1 },
  count:  { fontSize: 13, fontWeight: "700" },
});

// ─── Home tab ────────────────────────────────────────────────────────

function HomeTab({
  profile, navH, onRefine,
}: {
  profile: UserProfile; navH: number; onRefine: () => void;
}) {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [search,    setSearch]    = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    getAllResources().then(setResources).catch(() => setResources([]));
  }, []);

  // Filter by location + diagnosis + optional postcode
  const filtered = useMemo(() => {
    if (!resources) return [];
    return resources.filter(r => {
      const userZip  = profile.zipcode.replace(/\s/g, "").toLowerCase();
      const cityMatch = r.cities.some(c => c.toLowerCase() === profile.city.toLowerCase());
      const countryMatch = !!profile.country &&
        r.countries.some(rc => rc.toLowerCase() === profile.country.toLowerCase());
      const zipcodeMatch = userZip.length >= 3 && (r.zipcodes ?? []).some(z =>
        z.replace(/\s/g, "").toLowerCase().startsWith(userZip.slice(0, 4))
      );
      const locOk = cityMatch || zipcodeMatch ||
        (r.entireCountry && countryMatch);
      const diagOk   = r.diagnoses.length === 0 ||
        r.diagnoses.some(d => d.toLowerCase() === profile.diagnosis.toLowerCase());
      return locOk && diagOk;
    });
  }, [resources, profile]);

  // Search + category
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = q
      ? filtered.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.helpTypes.some(h => h.toLowerCase().includes(q))
        )
      : filtered;
    if (activeCat) base = base.filter(r => r.helpTypes.includes(activeCat));
    return base;
  }, [filtered, search, activeCat]);

  // Sectioned data
  const sections = useMemo(() => {
    if (search.trim() || activeCat) return [];
    const result: Array<{ key: string; label: string; accent?: string; resources: Resource[]; isFeatured?: boolean }> = [];
    const nearby = filtered.filter(r => !r.entireCountry && r.cities.some(c => c.toLowerCase() === profile.city.toLowerCase()));
    const featured = nearby.length >= 2 ? nearby.slice(0, 8) : filtered.slice(0, 8);
    if (featured.length > 0) result.push({ key: "__near", label: `Near you in ${profile.city}`, resources: featured, isFeatured: true });
    for (const cat of CAT_ORDER) {
      const catRes = filtered.filter(r => r.helpTypes.includes(cat));
      if (catRes.length > 0) result.push({ key: cat, label: CATS[cat].label, accent: CATS[cat].accent, resources: catRes });
    }
    return result;
  }, [filtered, search, activeCat, profile.city]);

  const availCats = useMemo(() => {
    const s = new Set<string>();
    filtered.forEach(r => r.helpTypes.forEach(h => s.add(h)));
    return CAT_ORDER.filter(c => s.has(c));
  }, [filtered]);

  const isFiltered = !!(search.trim() || activeCat);

  // Loading
  if (!resources) {
    return (
      <View style={ht.center}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={ht.loadText}>Finding support in {profile.city}…</Text>
      </View>
    );
  }

  // No results
  if (filtered.length === 0) {
    return (
      <View style={ht.center}>
        <Text style={ht.noResultsTitle}>Coming soon to {profile.city}</Text>
        <Text style={ht.noResultsSub}>We're expanding quickly. Check back soon.</Text>
        <TouchableOpacity style={ht.pill} onPress={onRefine}>
          <Text style={ht.pillText}>Search all resources</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Header = (
    <View>
      {/* Context line */}
      <View style={ht.contextLine}>
        <Text style={ht.contextCity}>{profile.city}</Text>
        <Text style={ht.contextDot}> · </Text>
        <Text style={ht.contextDiag}>{profile.diagnosis}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onRefine} style={ht.refineBtn}>
          <Text style={ht.refineTxt}>Refine</Text>
        </TouchableOpacity>
      </View>

      {/* Search pill */}
      <View style={ht.searchPill}>
        <Ionicons name="search" size={16} color={L3} style={{ marginLeft: 2 }} />
        <TextInput
          style={ht.searchInput}
          value={search}
          onChangeText={t => { setSearch(t); setActiveCat(null); }}
          placeholder="Resources, organisations, categories…"
          placeholderTextColor={L3}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={ht.chipsRow}>
        {(["All", ...availCats] as string[]).map(cat => {
          const isAll    = cat === "All";
          const isActive = isAll ? !activeCat : activeCat === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => { setActiveCat(isAll ? null : (activeCat === cat ? null : cat)); setSearch(""); }}
              style={[ht.chip, isActive && ht.chipOn]}
              activeOpacity={0.7}
            >
              <Text style={[ht.chipTxt, isActive && ht.chipTxtOn]}>
                {isAll ? "All" : (CATS[cat]?.label ?? cat)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section label when filtered */}
      {isFiltered ? (
        <View style={ht.filterBar}>
          <Text style={ht.filterLabel}>
            {displayed.length} result{displayed.length !== 1 ? "s" : ""}
            {search.trim() ? `  ·  "${search.trim()}"` : ""}
            {activeCat ? `  ·  ${CATS[activeCat]?.label ?? activeCat}` : ""}
          </Text>
          <TouchableOpacity onPress={() => { setSearch(""); setActiveCat(null); }} hitSlop={8}>
            <Text style={ht.clearBtn}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={ht.feedHeading}>
          <Text style={ht.feedTitle}>Support near you</Text>
        </View>
      )}
    </View>
  );

  if (isFiltered) {
    return (
      <FlatList
        data={displayed}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: H_PAD }}>
            <SearchCard resource={item} />
          </View>
        )}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: navH + 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={ht.emptyWrap}>
            <Text style={ht.emptyTitle}>No results</Text>
            <Text style={ht.emptySub}>Try a different search term or category.</Text>
          </View>
        }
      />
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={s => s.key}
      renderItem={({ item: s }) => (
        <SectionRow label={s.label} accent={s.accent} resources={s.resources} isFeatured={s.isFeatured} />
      )}
      ListHeaderComponent={Header}
      contentContainerStyle={{ paddingBottom: navH + 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const ht = StyleSheet.create({
  center:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  loadText:     { fontSize: 15, color: L2, marginTop: 8 },
  noResultsTitle:{ fontSize: 22, fontWeight: "700", color: L1, textAlign: "center" },
  noResultsSub: { fontSize: 16, color: L2, textAlign: "center", lineHeight: 24 },
  pill:         { marginTop: 8, backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  pillText:     { fontSize: 17, fontWeight: "700", color: WHITE },

  contextLine:  { flexDirection: "row", alignItems: "center", paddingHorizontal: H_PAD, paddingTop: 16, paddingBottom: 14 },
  contextCity:  { fontSize: 14, fontWeight: "700", color: L1 },
  contextDot:   { fontSize: 14, color: L3 },
  contextDiag:  { fontSize: 14, color: L2 },
  refineBtn:    { backgroundColor: "#FFF0E8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  refineTxt:    { fontSize: 13, fontWeight: "700", color: ORANGE },

  searchPill:   { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, marginHorizontal: H_PAD, borderRadius: 14, paddingHorizontal: 14, gap: 8, height: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  searchInput:  { flex: 1, fontSize: 16, color: L1, paddingVertical: 0 },

  chipsRow:     { paddingHorizontal: H_PAD, paddingBottom: 4, gap: 8, flexDirection: "row" },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: FILL },
  chipOn:       { backgroundColor: ORANGE },
  chipTxt:      { fontSize: 14, fontWeight: "500", color: L2 },
  chipTxtOn:    { color: WHITE, fontWeight: "600" },

  filterBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingVertical: 14 },
  filterLabel:  { fontSize: 13, color: L2 },
  clearBtn:     { fontSize: 14, color: ORANGE, fontWeight: "600" },

  feedHeading:  { paddingHorizontal: H_PAD, paddingTop: 24, paddingBottom: 14 },
  feedTitle:    { fontSize: 22, fontWeight: "700", color: L1 },

  emptyWrap:    { alignItems: "center", paddingVertical: 48 },
  emptyTitle:   { fontSize: 18, fontWeight: "700", color: L1, marginBottom: 6 },
  emptySub:     { fontSize: 15, color: L2, textAlign: "center" },
});

// ─── Search tab ───────────────────────────────────────────────────────

function SearchTab({ navH }: { navH: number }) {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    getAllResources().then(setResources).catch(() => setResources([]));
  }, []);

  const results = useMemo(() => {
    if (!resources) return [];
    const q = search.trim().toLowerCase();
    if (!q) return resources.slice(0, 20);
    return resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.helpTypes.some(h => h.toLowerCase().includes(q))
    );
  }, [resources, search]);

  return (
    <FlatList
      data={results}
      keyExtractor={r => r.id}
      renderItem={({ item }) => <SearchCard resource={item} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: navH + 16 }}
      ListHeaderComponent={
        <View style={st.header}>
          <Text style={st.title}>Explore</Text>
          <View style={st.searchPill}>
            <Ionicons name="search" size={16} color={L3} style={{ marginLeft: 2 }} />
            <TextInput
              style={st.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search all resources…"
              placeholderTextColor={L3}
              autoCorrect={false}
              clearButtonMode="while-editing"
              autoFocus
            />
          </View>
          {search.trim().length > 0 && (
            <Text style={st.count}>{results.length} result{results.length !== 1 ? "s" : ""}</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        !resources ? (
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        ) : (
          <View style={ht.emptyWrap}>
            <Text style={ht.emptyTitle}>No results</Text>
            <Text style={ht.emptySub}>Try a different search term.</Text>
          </View>
        )
      }
    />
  );
}

const st = StyleSheet.create({
  header:     { paddingTop: 16, paddingBottom: 8 },
  title:      { fontSize: 28, fontWeight: "700", color: L1, marginBottom: 16, paddingHorizontal: 0 },
  searchPill: { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, gap: 8, height: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, marginBottom: 8 },
  searchInput:{ flex: 1, fontSize: 16, color: L1, paddingVertical: 0 },
  count:      { fontSize: 13, color: L2, paddingBottom: 6 },
});

// ─── Profile tab ──────────────────────────────────────────────────────

function ProfileTab({ profile, onEdit, navH }: { profile: UserProfile; onEdit: () => void; navH: number }) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: navH + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header card */}
      <View style={pt.hero}>
        <Image
          source={require("../assets/canopy-logo.png")}
          style={{ width: 72, height: 72, marginBottom: 14 }}
          resizeMode="contain"
        />
        <Text style={pt.heroName}>{profile.city}</Text>
        <Text style={pt.heroDiag}>{profile.diagnosis}</Text>
        {profile.zipcode ? <Text style={pt.heroZip}>{profile.zipcode}</Text> : null}
      </View>

      {/* Detail cards */}
      <View style={{ paddingHorizontal: H_PAD }}>
        <Text style={pt.sectionLabel}>Your profile</Text>

        <View style={pt.card}>
          <ProfileRow icon="location-outline" label="City" value={profile.city} />
          <View style={pt.sep} />
          <ProfileRow icon="ribbon-outline" label="Diagnosis" value={profile.diagnosis} />
          {profile.zipcode ? (
            <>
              <View style={pt.sep} />
              <ProfileRow icon="mail-outline" label="Postcode" value={profile.zipcode} />
            </>
          ) : null}
        </View>

        <TouchableOpacity style={pt.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Text style={pt.editTxt}>Update profile</Text>
        </TouchableOpacity>

        <Text style={pt.footNote}>
          Your profile is only stored on this device and is never shared.
        </Text>
      </View>
    </ScrollView>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={pt.row}>
      <Ionicons name={icon as any} size={20} color={L2} style={{ width: 28 }} />
      <Text style={pt.rowLabel}>{label}</Text>
      <Text style={pt.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const pt = StyleSheet.create({
  hero:       { backgroundColor: ORANGE, paddingTop: 48, paddingBottom: 36, alignItems: "center" },
  heroName:   { fontSize: 26, fontWeight: "800", color: WHITE, marginBottom: 4 },
  heroDiag:   { fontSize: 16, color: "rgba(255,255,255,0.80)", fontWeight: "500" },
  heroZip:    { fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  sectionLabel: { fontSize: 13, fontWeight: "600", color: L3, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 28, marginBottom: 10 },

  card:       { backgroundColor: WHITE, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, gap: 10 },
  rowLabel:   { fontSize: 17, color: L2, flex: 1 },
  rowValue:   { fontSize: 17, fontWeight: "600", color: L1 },
  sep:        { height: StyleSheet.hairlineWidth, backgroundColor: SEP, marginHorizontal: 16 },

  editBtn:    { marginTop: 16, backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  editTxt:    { fontSize: 17, fontWeight: "700", color: WHITE },

  footNote:   { marginTop: 20, fontSize: 13, color: L3, textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
});

// ─── Bottom nav ───────────────────────────────────────────────────────

function BottomNav({ tab, setTab, bottomInset }: {
  tab: Tab; setTab: (t: Tab) => void; bottomInset: number;
}) {
  const height = NAV_H + bottomInset;
  const items: { id: Tab; label: string; icon: string; iconActive: string }[] = [
    { id: "home",    label: "Home",    icon: "home-outline",    iconActive: "home" },
    { id: "search",  label: "Explore", icon: "compass-outline", iconActive: "compass" },
    { id: "profile", label: "Me",      icon: "person-outline",  iconActive: "person" },
  ];

  return (
    <View style={[bn.bar, { height, paddingBottom: bottomInset }]}>
      {items.map(item => {
        const active = tab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={bn.item}
            onPress={() => setTab(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(active ? item.iconActive : item.icon) as any}
              size={24}
              color={active ? ORANGE : L3}
            />
            <Text style={[bn.label, active && bn.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const bn = StyleSheet.create({
  bar:   {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(252, 247, 242, 0.96)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.10)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 20,
  },
  item:        { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 10, gap: 3 },
  label:       { fontSize: 10, fontWeight: "500", color: L3 },
  labelActive: { color: ORANGE, fontWeight: "600" },
});

// ─── Root ────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router                    = useRouter();
  const { startSession, saveAnswer } = useSession();
  const insets                    = useSafeAreaInsets();
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [tab,     setTab]         = useState<Tab>("home");

  const navH = NAV_H + insets.bottom;

  const handleRefine = useCallback(async () => {
    await startSession();
    // Pre-populate location + diagnosis so wizard skips those steps
    if (profile) {
      await saveAnswer("location", profile.city);
      if (profile.country) await saveAnswer("country", profile.country);
      if (profile.zipcode) await saveAnswer("zipcode", profile.zipcode);
      await saveAnswer("diagnosis", profile.diagnosis);
    }
    router.push("/wizard/age");
  }, [startSession, saveAnswer, profile, router]);

  if (!profile) return <Onboarding onDone={p => { setProfile(p); setTab("home"); }} />;

  return (
    <View style={{ flex: 1, backgroundColor: CREAM }}>
      {/* Safe area top for content */}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {tab === "home"    && <HomeTab profile={profile} navH={navH} onRefine={handleRefine} />}
        {tab === "search"  && <SearchTab navH={navH} />}
        {tab === "profile" && <ProfileTab profile={profile} onEdit={() => setProfile(null)} navH={navH} />}
      </View>

      <BottomNav tab={tab} setTab={setTab} bottomInset={insets.bottom} />
    </View>
  );
}
