import { useColorScheme } from "react-native";
import { colors } from "@/constants/theme";

/** Colours that are set from JavaScript (not className), so they need to follow light/dark mode manually. */
export const useThemeColors = () => {
    const isDark = useColorScheme() === "dark";

    return {
        isDark,
        placeholder: isDark ? "rgba(245, 239, 224, 0.4)" : "rgba(0, 0, 0, 0.4)",
        // A lighter navy in dark mode so the floating tab bar stands out from the dark background
        tabBar: isDark ? "#1e2a44" : colors.primary,
    };
};
