/**
 * Project Name Generator
 * Generates unique, memorable project names for new projects
 */

const ADJECTIVES = [
  'Creative',
  'Blazing',
  'Epic',
  'Quantum',
  'Silent',
  'Cosmic',
  'Vibrant',
  'Dynamic',
  'Swift',
  'Radiant',
  'Thunder',
  'Crystal',
  'Stellar',
  'Phoenix',
  'Ethereal',
  'Brilliant',
  'Mystic',
  'Serene',
  'Bold',
  'Luminous',
];

const NOUNS = [
  'Phoenix',
  'Thunder',
  'Nebula',
  'Summit',
  'Vision',
  'Echo',
  'Aurora',
  'Horizon',
  'Catalyst',
  'Genesis',
  'Zenith',
  'Prism',
  'Pulse',
  'Vortex',
  'Beacon',
  'Odyssey',
  'Sanctuary',
  'Spectra',
  'Tides',
  'Wings',
];

/**
 * Generate a random project name
 * Format: Adjective Noun Number
 * Example: "Blazing Phoenix 847"
 */
export function generateProjectName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj} ${noun} ${num}`;
}

/**
 * Generate multiple unique project names
 */
export function generateProjectNames(count: number): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  
  while (names.length < count) {
    const name = generateProjectName();
    if (!seen.has(name)) {
      names.push(name);
      seen.add(name);
    }
  }
  
  return names;
}

/**
 * Validate if a project name is available/unique
 * In a real system, this would check against database
 */
export function isValidProjectName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}
