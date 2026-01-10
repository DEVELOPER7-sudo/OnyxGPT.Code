// Random project name generator
const adjectives = [
  'swift', 'bright', 'cosmic', 'lunar', 'stellar', 'quantum', 'cyber', 'neon',
  'solar', 'crystal', 'golden', 'silver', 'mystic', 'arctic', 'tropical',
  'atomic', 'digital', 'epic', 'mega', 'ultra', 'hyper', 'super', 'prime',
  'alpha', 'beta', 'delta', 'omega', 'nova', 'pixel', 'turbo', 'rapid',
  'blazing', 'frozen', 'electric', 'magnetic', 'sonic', 'vivid', 'lucid'
];

const nouns = [
  'phoenix', 'dragon', 'falcon', 'wolf', 'tiger', 'panther', 'hawk', 'eagle',
  'comet', 'nebula', 'galaxy', 'star', 'moon', 'sun', 'orbit', 'pulse',
  'spark', 'flash', 'wave', 'storm', 'forge', 'nexus', 'core', 'matrix',
  'cipher', 'prism', 'vertex', 'vortex', 'apex', 'zenith', 'horizon', 'echo',
  'fusion', 'blade', 'shield', 'crown', 'thunder', 'lightning', 'aurora'
];

export const generateRandomName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}-${noun}-${number}`;
};

export const generateSubdomain = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || generateRandomName();
};
