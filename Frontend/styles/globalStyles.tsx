import { StyleSheet } from "react-native";

export const colors = {
  primary: "#E64A0D",
  primaryLight: "#FF7F50",
  secondary: "#FF5722",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#666666",
  lightGray: "#CCCCCC",
  borderGray: "#E0E0E0",
  error: "#D32F2F",
  errorBackground: "#FFEBEE",
  success: "#4CAF50",
  successBackground: "#E8F5E8",
  background: "#F5F5F5",
  inputBackground: "#F9F9F9",
};

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 25,
  xxl: 30,
};

export const borderRadius = {
  sm: 5,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const fontSize = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
  header: 28,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: "bold",
    color: colors.black,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.gray,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  linkBold: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  shadowBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
