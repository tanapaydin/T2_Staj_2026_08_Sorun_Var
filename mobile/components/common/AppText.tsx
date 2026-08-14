import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { Colors, Typography } from "../../theme";

type Variant =
  | "titleLarge"
  | "title"
  | "heading"
  | "body"
  | "bodyMedium"
  | "caption"

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export default function AppText({
  variant = "body",
  color = Colors.text,
  style,
  children,
  ...props
}: Props) {
  return (
    <Text
      style={[styles.base, Typography[variant], { color }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
});
