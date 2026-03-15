import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import { useSession } from "../../context/SessionContext";
import { getSheetCities, getSheetCityCountryMap } from "../../services/api";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

export default function LocationStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.location ?? "");
  const [zipcode, setZipcode] = useState(answers.zipcode ?? "");
  const [loading, setLoading] = useState(false);
  const [sheetCities, setSheetCities] = useState<string[]>([]);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    Promise.all([getSheetCities(), getSheetCityCountryMap()])
      .then(([cities, map]) => {
        setSheetCities(cities);
        setCityCountryMap(map);
      })
      .catch(() => setSheetCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  // Find exact case-insensitive match in the database
  const matchedCity = useMemo(
    () => sheetCities.find((c) => c.toLowerCase() === query.trim().toLowerCase()),
    [query, sheetCities]
  );

  // Dropdown suggestions — only when no exact match yet
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || matchedCity) return [];
    return sheetCities.filter((c) => c.toLowerCase().startsWith(q));
  }, [query, sheetCities, matchedCity]);

  const isValid = !!matchedCity;

  const handleSelect = (city: string) => {
    setQuery(city);
  };

  const handleUseLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGeoError("Location access denied. Please type your city instead.");
        setGeoLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      // Reverse geocode with Expo Location
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const city = geo?.city || geo?.subregion || geo?.region || "";
      const postcode = geo?.postalCode || "";

      if (city) {
        // Try exact match
        const exact = sheetCities.find(
          (c) => c.toLowerCase() === city.toLowerCase()
        );
        if (exact) {
          setQuery(exact);
          if (postcode) setZipcode(postcode);
        } else {
          // Try partial match
          const partial = sheetCities.find(
            (c) =>
              c.toLowerCase().includes(city.toLowerCase()) ||
              city.toLowerCase().includes(c.toLowerCase())
          );
          if (partial) {
            setQuery(partial);
            if (postcode) setZipcode(postcode);
          } else {
            // Try prefix match
            const nearby = sheetCities.find((c) =>
              c.toLowerCase().startsWith(city.toLowerCase().slice(0, 3))
            );
            if (nearby) {
              setQuery(nearby);
              if (postcode) setZipcode(postcode);
            } else {
              setQuery(city);
              if (postcode) setZipcode(postcode);
              setGeoError(
                `We detected "${city}" but couldn't find an exact match. Try selecting from suggestions.`
              );
            }
          }
        }
      } else {
        setGeoError("Could not determine your city. Please type it manually.");
      }
    } catch {
      setGeoError("Could not get your location. Please type your city.");
    } finally {
      setGeoLoading(false);
    }
  }, [sheetCities]);

  const handleNext = async () => {
    if (!matchedCity) return;
    setLoading(true);
    try {
      await saveAnswer("location", matchedCity);
      const country = cityCountryMap[matchedCity];
      if (country) {
        await saveAnswer("country", country);
      }
      if (zipcode.trim()) {
        await saveAnswer("zipcode", zipcode.trim());
      }
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Share your location or type your city below."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <View style={styles.container}>
        {/* Use My Location button */}
        <TouchableOpacity
          style={[styles.locationBtn, geoLoading && styles.locationBtnDisabled]}
          onPress={handleUseLocation}
          disabled={geoLoading || citiesLoading}
          activeOpacity={0.7}
        >
          {geoLoading ? (
            <View style={styles.locationBtnContent}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.locationBtnText}>Finding your location...</Text>
            </View>
          ) : (
            <View style={styles.locationBtnContent}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationBtnText}>Use my location</Text>
            </View>
          )}
        </TouchableOpacity>

        {geoError ? (
          <Text style={styles.geoError}>{geoError}</Text>
        ) : null}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or type your city</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={[styles.input, isValid && styles.inputSelected]}
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. London"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />

        {citiesLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
        )}

        {suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((city, index) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.item,
                  index === suggestions.length - 1 && styles.itemLast,
                ]}
                onPress={() => handleSelect(city)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isValid && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              {matchedCity}{cityCountryMap[matchedCity] ? `, ${cityCountryMap[matchedCity]}` : ""}
            </Text>
          </View>
        )}

        {isValid && (
          <View style={styles.zipcodeSection}>
            <Text style={styles.zipcodeLabel}>Postcode / Zip code (optional)</Text>
            <TextInput
              style={styles.input}
              value={zipcode}
              onChangeText={setZipcode}
              placeholder="e.g. SW1A 1AA or 94102"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        )}
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  locationBtn: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1.5,
    borderColor: "#a7f3d0",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  locationBtnDisabled: {
    opacity: 0.5,
  },
  locationBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationBtnText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: "#047857",
  },
  geoError: {
    fontSize: fontSize.sm,
    color: "#d97706",
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  inputSelected: {
    borderColor: colors.primary,
  },
  spinner: {
    marginTop: spacing.sm,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
  },
  selectedBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.chipSelected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  selectedBadgeText: {
    color: colors.chipSelectedText,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
  zipcodeSection: {
    marginTop: spacing.lg,
  },
  zipcodeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
});
