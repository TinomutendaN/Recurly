import type { ImageSourcePropType } from "react-native";
import { icons, type IconKey } from "@/constants/icons";

// Brands with a logo bundled in assets/icons — these take priority over remote logos
const BUNDLED_BRANDS: IconKey[] = ["notion", "dropbox", "openai", "adobe", "medium", "figma", "spotify", "github", "claude", "canva"];

// Well-known subscriptions and the website whose logo represents them.
// Order matters: more specific names come first ("Apple Music" before "Apple", "YouTube Music" before "YouTube").
const BRAND_DOMAINS: [keywords: string[], domain: string][] = [
    // Apple
    [["apple music"], "music.apple.com"],
    [["apple tv"], "tv.apple.com"],
    [["icloud"], "icloud.com"],
    [["apple one", "apple arcade", "apple"], "apple.com"],

    // Video streaming
    [["netflix"], "netflix.com"],
    [["disney"], "disneyplus.com"],
    [["hulu"], "hulu.com"],
    [["hbo"], "max.com"],
    [["prime video"], "primevideo.com"],
    [["paramount"], "paramountplus.com"],
    [["peacock"], "peacocktv.com"],
    [["crunchyroll"], "crunchyroll.com"],
    [["showmax"], "showmax.com"],
    [["dstv"], "dstv.com"],
    [["dazn"], "dazn.com"],
    [["espn"], "espn.com"],
    [["twitch"], "twitch.tv"],
    [["youtube music"], "music.youtube.com"],
    [["youtube"], "youtube.com"],

    // Music & audio
    [["tidal"], "tidal.com"],
    [["deezer"], "deezer.com"],
    [["soundcloud"], "soundcloud.com"],
    [["audible"], "audible.com"],
    [["kindle", "amazon prime", "amazon"], "amazon.com"],

    // AI tools
    [["chatgpt"], "chatgpt.com"],
    [["gemini"], "gemini.google.com"],
    [["perplexity"], "perplexity.ai"],
    [["midjourney"], "midjourney.com"],
    [["cursor"], "cursor.com"],
    [["copilot"], "github.com"],

    // Productivity & cloud
    [["microsoft", "office 365", "xbox", "game pass"], "microsoft.com"],
    [["google one", "google drive"], "one.google.com"],
    [["google workspace"], "workspace.google.com"],
    [["evernote"], "evernote.com"],
    [["todoist"], "todoist.com"],
    [["slack"], "slack.com"],
    [["zoom"], "zoom.us"],
    [["trello"], "trello.com"],
    [["asana"], "asana.com"],
    [["linear"], "linear.app"],
    [["1password"], "1password.com"],
    [["lastpass"], "lastpass.com"],
    [["nordvpn"], "nordvpn.com"],
    [["expressvpn"], "expressvpn.com"],
    [["grammarly"], "grammarly.com"],

    // Developer tools
    [["vercel"], "vercel.com"],
    [["netlify"], "netlify.com"],
    [["aws"], "aws.amazon.com"],
    [["digitalocean"], "digitalocean.com"],
    [["heroku"], "heroku.com"],
    [["jetbrains"], "jetbrains.com"],
    [["framer"], "framer.com"],

    // Lifestyle, learning & social
    [["duolingo"], "duolingo.com"],
    [["headspace"], "headspace.com"],
    [["calm"], "calm.com"],
    [["strava"], "strava.com"],
    [["linkedin"], "linkedin.com"],
    [["patreon"], "patreon.com"],
    [["substack"], "substack.com"],
    [["uber"], "uber.com"],
    [["doordash"], "doordash.com"],

    // Gaming
    [["playstation"], "playstation.com"],
    [["nintendo"], "nintendo.com"],
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole-word matching so e.g. "Calm" doesn't match "Becalmed Notes"
const matchesKeyword = (name: string, keyword: string) =>
    new RegExp(`(^|[^a-z0-9])${escapeRegex(keyword)}($|[^a-z0-9])`).test(name);

const logoUrl = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

/** Picks the best logo for a subscription: bundled brand icon, then a known brand's logo, then the generic icon. */
export const getSubscriptionIcon = (name: string, iconKey?: string): ImageSourcePropType => {
    const lowerName = name.toLowerCase();

    if (iconKey && BUNDLED_BRANDS.includes(iconKey as IconKey)) {
        return icons[iconKey as IconKey];
    }

    const bundled = BUNDLED_BRANDS.find((key) => matchesKeyword(lowerName, key));
    if (bundled) return icons[bundled];

    const brand = BRAND_DOMAINS.find(([keywords]) => keywords.some((keyword) => matchesKeyword(lowerName, keyword)));
    if (brand) return { uri: logoUrl(brand[1]) };

    return icons.plus;
};
