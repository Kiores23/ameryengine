export async function loadSceneJsonFromUrl(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Impossible de charger la scène: ${url} (${res.status})`);
  }

  const data = await res.json();
  validateSceneData(data);
  return data;
}

export async function loadSceneJsonFromFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  validateSceneData(data);
  return data;
}

export function downloadSceneJson(sceneData, filename = "scene.json") {
  const blob = new Blob([JSON.stringify(sceneData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export function validateSceneData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Scene data invalide : objet attendu.");
  }

  if (!Array.isArray(data.objects)) {
    throw new Error("Scene data invalide : 'objects' doit être un tableau.");
  }

  for (const obj of data.objects) {
    if (!obj || typeof obj !== "object") {
      throw new Error("Objet de scène invalide.");
    }

    if (typeof obj.name !== "string" || !obj.name.trim()) {
      throw new Error("Chaque objet doit avoir un nom valide.");
    }

    if (typeof obj.model !== "string" || !obj.model.trim()) {
      throw new Error(`L'objet "${obj.name}" n'a pas de model valide.`);
    }
  }
}