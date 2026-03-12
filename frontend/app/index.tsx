import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSession } from "../context/SessionContext";
import { getSheetCities, getSheetCityCountryMap, getSheetResources } from "../services/api";
import { Resource } from "../data/resources";
import ResourceCard from "../components/ResourceCard";
import { colors, fontSize, radius, spacing } from "../utils/theme";

// ── Location picker ─────────────────────────────────────────────────

function LocationPicker({
  onSelect,
}: {
  onSelect: (city: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheetCities()
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 8);
  }, [query, cities]);

  return (
    <SafeAreaView style={pickerStyles.container}>
      <View style={pickerStyles.content}>
        <Text style={pickerStyles.logo}>Canopy</Text>
        <Text style={pickerStyles.heading}>Where are you located?</Text>
        <Text style={pickerStyles.sub}>
          We'll show you support resources available near you.
        </Text>

        <View style={pickerStyles.inputWrap}>
          <Text style={pickerStyles.inputIcon}>📍</Text>
          <TextInput
            style={pickerStyles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Enter your city…"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={pickerStyles.dropdown}>
            {suggestions.map((city, i) => (
              <TouchableOpacity
                key={city}
                style={[pickerStyles.item, i === suggestions.length - 1 && pickerStyles.itemLast]}
                onPress={() => onSelect(city)}
                activeOpacity={0.7}
              >
                <Text style={pickerStyles.itemIcon}>📍</Text>
                <Text style={pickerStyles.itemText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxl },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { fontSize: 18, marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  itemLast: { borderBottomWidth: 0 },
  itemIcon: { fontSize: 14 },
  itemText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
  },
});

// ── Coming soon ──────────────────────────────────────────────────────

function ComingSoon({ city, onChangeCity, onAdvancedSearch }: {
  city: string;
  onChangeCity: () => void;
  onAdvancedSearch: () => void;
}) {
  return (
    <SafeAreaView style={comingStyles.container}>
      <View style={comingStyles.header}>
        <Text style={comingStyles.logo}>Canopy</Text>
        <TouchableOpacity style={comingStyles.locationBtn} onPress={onChangeCity}>
          <Text style={comingStyles.locationIcon}>📍</Text>
          <Text style={comingStyles.locationText}>{city}</Text>
          <Text style={comingStyles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={comingStyles.body}>
        <Text style={comingStyles.emoji}>🌱</Text>
        <Text style={comingStyles.title}>Coming soon to {city}</Text>
        <Text style={comingStyles.sub}>
          We're working on adding support resources in your area. Check back soon — we're growing fast.
        </Text>
        <TouchableOpacity style={comingStyles.searchBtn} onPress={onAdvancedSearch}>
          <Text style={comingStyles.searchBtnText}>Search all resources</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const comingStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  logo: { fontSize: 18, fontWeight: "800", color: colors.primary },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  locationIcon: { fontSize: 13 },
  locationText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  chevron: { fontSize: 18, color: colors.textSecondary, lineHeight: 20 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emoji: { fontSize: 64, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: spacing.md },
  sub: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: spacing.xl },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.body },
});

// ── Feed ─────────────────────────────────────────────────────────────

function Feed({
  city,
  resources,
  onChangeCity,
  onAdvancedSearch,
}: {
  city: string;
  resources: Resource[];
  onChangeCity: () => void;
  onAdvancedSearch: () => void;
}) {
  const header = (
    <View>
      {/* Sticky-style top bar */}
      <View style={feedStyles.topBar}>
        <Text style={feedStyles.logo}>Canopy</Text>
        <TouchableOpacity style={feedStyles.locationBtn} onPress={onChangeCity}>
          <Text style={feedStyles.locationIcon}>📍</Text>
          <Text style={feedStyles.locationText}>{city}</Text>
          <Text style={feedStyles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Section header */}
      <View style={feedStyles.sectionHeader}>
        <View>
          <Text style={feedStyles.sectionTitle}>Support near you</Text>
          <Text style={feedStyles.sectionSub}>
            {resources.length} resource{resources.length !== 1 ? "s" : ""} available
          </Text>
        </View>
        <TouchableOpacity style={feedStyles.advancedBtn} onPress={onAdvancedSearch}>
          <Text style={feedStyles.advancedBtnText}>Refine search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={feedStyles.container}>
      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ResourceCard resource={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={feedStyles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const feedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 18, fontWeight: "800", color: colors.primary },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  locationIcon: { fontSize: 13 },
  locationText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  chevron: { fontSize: 18, color: colors.textSecondary, lineHeight: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  sectionSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  advancedBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  advancedBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});

// ── Root component ───────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { startSession } = useSession();

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [allResources, setAllResources] = useState<Resource[] | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Load city→country map once
  useEffect(() => {
    getSheetCityCountryMap().then(setCityCountryMap).catch(() => {});
  }, []);

  // Load all resources when a city is first selected
  useEffect(() => {
    if (!selectedCity || allResources !== null) return;
    setResourcesLoading(true);
    getSheetResources()
      .then(setAllResources)
      .catch(() => setAllResources([]))
      .finally(() => setResourcesLoading(false));
  }, [selectedCity]);

  const filteredResources = useMemo(() => {
    if (!allResources || !selectedCity) return [];
    return allResources.filter(
      (r) =>
        r.entireCountry ||
        r.cities.some((c) => c.toLowerCase() === selectedCity.toLowerCase())
    );
  }, [allResources, selectedCity]);

  const handleAdvancedSearch = useCallback(async () => {
    await startSession();
    router.push("/wizard/age");
  }, [startSession, router]);

  const handleChangeCity = useCallback(() => {
    setSelectedCity(null);
  }, []);

  // No city chosen yet
  if (!selectedCity) {
    return <LocationPicker onSelect={setSelectedCity} />;
  }

  // City chosen, resources still loading
  if (resourcesLoading) {
    return (
      <SafeAreaView style={loadingStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={loadingStyles.text}>Finding resources in {selectedCity}…</Text>
      </SafeAreaView>
    );
  }

  // City chosen, no resources
  if (filteredResources.length === 0) {
    return (
      <ComingSoon
        city={selectedCity}
        onChangeCity={handleChangeCity}
        onAdvancedSearch={handleAdvancedSearch}
      />
    );
  }

  // City chosen, resources found
  return (
    <Feed
      city={selectedCity}
      resources={filteredResources}
      onChangeCity={handleChangeCity}
      onAdvancedSearch={handleAdvancedSearch}
    />
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  text: { fontSize: fontSize.body, color: colors.textSecondary },
});
