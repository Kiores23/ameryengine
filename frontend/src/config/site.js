import { resolvePublicPath } from "../utils/publicPath";

function isExternalHref(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("mailto:") || value.startsWith("tel:");
}

function resolveSiteHref(value, fallbackPath) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return resolvePublicPath(fallbackPath);
  }

  if (isExternalHref(normalizedValue)) {
    return normalizedValue;
  }

  return resolvePublicPath(normalizedValue);
}

export const CONTACT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL || "alexis.dmery@gmail.com";

export const GITHUB_URL =
  import.meta.env.VITE_CONTACT_GITHUB_URL || "https://github.com/alexisdmery";

export const LINKEDIN_URL =
  import.meta.env.VITE_CONTACT_LINKEDIN_URL ||
  "https://www.linkedin.com/in/alexis-dmery/";

export const RESUME_URL = resolveSiteHref(
  import.meta.env.VITE_CONTACT_RESUME_URL,
  "cv.pdf"
);

