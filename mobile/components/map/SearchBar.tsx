import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { LocationSuggestion } from "../../lib/api";

import {
  AppButton,
  AppCard,
  AppText,
} from "../common";

import {
  Colors,
  Radius,
  Spacing,
} from "../../theme";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  suggestions: LocationSuggestion[];

  onSelectSuggestion: (
    item: LocationSuggestion
  ) => void;

  onSearch: () => void;

  onClear: () => void;
};

export default function SearchBar({
  search,
  setSearch,
  suggestions,
  onSelectSuggestion,
  onSearch,
  onClear,
}: Props) {
  return (
    <>
      <AppCard style={styles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Konum ara..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />

        {search.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
          >
            <AppText
              variant="bodyMedium"
              color={Colors.textMuted}
            >
              ✕
            </AppText>
          </TouchableOpacity>
        )}

        <AppButton
          title="Ara"
          onPress={onSearch}
          style={styles.searchButton}
        />
      </AppCard>

      {suggestions.length > 0 && (
        <AppCard style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item.name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => onSelectSuggestion(item)}
            >
              <AppText
                variant="body"
                color={Colors.text}
              >
                {item.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </AppCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    zIndex: 20,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
  },

  clearButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },

  searchButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  suggestionsContainer: {
    position: "absolute",
    top: 115,
    left: 20,
    right: 20,
    zIndex: 19,

    padding: 0,
    overflow: "hidden",
  },

  suggestionItem: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
});