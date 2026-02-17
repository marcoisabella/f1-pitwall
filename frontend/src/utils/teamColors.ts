export const TEAM_COLORS: Record<string, { hex: string; name: string }> = {
  'Red Bull Racing': { hex: '#3671C6', name: 'Blue' },
  'McLaren': { hex: '#FF8000', name: 'Papaya' },
  'Ferrari': { hex: '#E8002D', name: 'Red' },
  'Mercedes': { hex: '#27F4D2', name: 'Teal' },
  'Aston Martin': { hex: '#229971', name: 'Green' },
  'Alpine': { hex: '#FF87BC', name: 'Pink' },
  'Haas F1 Team': { hex: '#B6BABD', name: 'Silver' },
  'RB': { hex: '#6692FF', name: 'Blue' },
  'Williams': { hex: '#64C4FF', name: 'Light Blue' },
  'Kick Sauber': { hex: '#52E252', name: 'Green' },
};

export function getTeamColor(teamName: string): string {
  // Try exact match first
  if (TEAM_COLORS[teamName]) {
    return TEAM_COLORS[teamName].hex;
  }
  // Fuzzy match by checking if team name contains a known key
  for (const [key, value] of Object.entries(TEAM_COLORS)) {
    if (teamName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(teamName.toLowerCase())) {
      return value.hex;
    }
  }
  return '#888888';
}

export function getTeamColorFromHex(hex: string): string {
  // OpenF1 returns team_colour as hex without #
  if (hex && !hex.startsWith('#')) {
    return `#${hex}`;
  }
  return hex || '#888888';
}
