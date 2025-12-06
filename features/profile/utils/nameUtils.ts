/**
 * Utilitaires pour gérer le name unique de la base de données
 * qui est séparé en firstName/lastName dans l'UI
 */

/**
 * Divise un name en firstName et lastName
 */
export function splitName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!name || name.trim() === "") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = name.trim();
  const parts = trimmedName.split(/\s+/);
  
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

/**
 * Combine firstName et lastName en un name unique
 */
export function combineName(firstName: string, lastName: string): string {
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  
  if (!trimmedFirstName && !trimmedLastName) {
    return "";
  }
  
  if (!trimmedLastName) {
    return trimmedFirstName;
  }
  
  return `${trimmedFirstName} ${trimmedLastName}`.trim();
}

