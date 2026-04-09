const BASE_URL = import.meta.env.BASE_URL || "/";

export function resolvePublicPath(path = "") {
  const normalizedPath = String(path).replace(/^\/+/, "");

  if (!normalizedPath) {
    return BASE_URL;
  }

  if (BASE_URL === "./" || BASE_URL === ".") {
    return `./${normalizedPath}`;
  }

  const normalizedBase = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${normalizedBase}${normalizedPath}`;
}

