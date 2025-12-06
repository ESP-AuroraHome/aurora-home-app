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

