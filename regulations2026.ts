// f1-pitwall/frontend/src/data/regulations2026.ts
// 2026 Regulation Changes — For the Regulations info page

export interface RegulationSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  details: string[];
  comparison?: { label: string; before: string; after: string }[];
}

export const REGULATIONS_2026: RegulationSection[] = [
  {
    id: "power-unit",
    title: "Power Unit Revolution",
    icon: "⚡",
    summary: "The biggest engine rule change since 2014. ~1,000 bhp with a 50/50 ICE-to-electric split.",
    details: [
      "Total power approximately 1,000 bhp — now roughly 50/50 split between ICE and electric (was ~80/20)",
      "MGU-H (Motor Generator Unit – Heat) has been REMOVED — simplifies the engine significantly",
      "MGU-K (Motor Generator Unit – Kinetic) output TRIPLED: from 120kW to 350kW (approximately 470 bhp from electric alone)",
      "100% advanced sustainable fuels are now mandatory for all teams",
      "Five engine manufacturers for 2026: Mercedes, Ferrari, Red Bull/Ford (new), Honda, Audi (new)",
      "Battery management becomes a critical strategic element — drivers must carefully manage charge and deploy cycles",
      "New 'Boost Button' allows drivers to manually deploy stored electrical energy for extra power",
      "Energy can be harvested through braking, coasting, lifting off throttle, or 'super clipping' (harvesting at full throttle on straights)",
    ],
    comparison: [
      { label: "Electric power share", before: "~20% (MGU-K 120kW)", after: "~50% (MGU-K 350kW)" },
      { label: "MGU-H", before: "Present", after: "Removed" },
      { label: "Fuel", before: "E10 blend", after: "100% sustainable" },
      { label: "Engine manufacturers", before: "4 (Mercedes, Ferrari, Renault, Honda)", after: "5 (Mercedes, Ferrari, Red Bull/Ford, Honda, Audi)" },
    ],
  },
  {
    id: "active-aero",
    title: "Active Aerodynamics — DRS is Dead",
    icon: "🦅",
    summary: "DRS eliminated after 13 years. Replaced by active front AND rear wings with Z-Mode and X-Mode.",
    details: [
      "DRS (Drag Reduction System) eliminated after being part of F1 since 2011",
      "Replaced by Manual Override Mode with active front AND rear wings",
      "Z-Mode (Low Drag): Driver-activated in designated zones when within 1 second of the car ahead. Both front and rear wings flatten simultaneously for overtaking — like DRS but with double the surfaces",
      "X-Mode (High Downforce): Default cornering mode with wings at maximum angle for grip",
      "Boost Button: Drivers can manually deploy stored electrical energy. Can use all at once for a burst or spread across a full lap",
      "Boost only works if the battery has sufficient charge — adds a new strategic layer",
      "Recharge modes: Cars harvest energy when braking, coasting, lifting off throttle, or super clipping",
    ],
    comparison: [
      { label: "Overtaking aid", before: "DRS (rear wing only)", after: "Z-Mode (front + rear wings)" },
      { label: "Activation", before: "DRS zones, within 1s", after: "Z-Mode zones, within 1s + Boost Button" },
      { label: "Energy strategy", before: "Minimal driver input", after: "Critical — manage charge/deploy" },
    ],
  },
  {
    id: "car-design",
    title: "Smaller, Lighter Cars",
    icon: "🏎️",
    summary: "Shorter wheelbase, narrower body, 30kg lighter. These should be the most agile F1 cars in years.",
    details: [
      "Wheelbase reduced from 360cm to 340cm — shorter cars for tighter racing",
      "Width reduced from 200cm to 190cm — narrower for closer wheel-to-wheel action",
      "Minimum weight reduced by approximately 30kg",
      "Overall: shorter, narrower, nimbler cars that should produce better racing and more overtaking opportunities",
    ],
    comparison: [
      { label: "Wheelbase", before: "360cm", after: "340cm" },
      { label: "Width", before: "200cm", after: "190cm" },
      { label: "Weight", before: "~798kg", after: "~768kg (~30kg lighter)" },
    ],
  },
  {
    id: "new-teams",
    title: "Grid Expansion — 11 Teams, 22 Drivers",
    icon: "🏁",
    summary: "Cadillac joins as the brand-new 11th team. Audi replaces Sauber as a full works manufacturer.",
    details: [
      "Grid expands from 10 teams / 20 drivers to 11 teams / 22 drivers",
      "Cadillac F1 Team: First new team since Haas in 2016. Originally the Andretti bid, now under Cadillac/GM banner (TWG Motorsports). Uses Ferrari engines initially, developing own GM power unit for 2029. Second American team on the grid.",
      "Audi F1 Team: Formerly Kick Sauber, now a full Audi works operation with their own power unit. Mattia Binotto (former Ferrari team boss) leads as COO. Based in Hinwil (chassis) and Neuburg (PU).",
      "Drivers for Cadillac: Valtteri Bottas (#77) and Sergio Pérez (#11) — combined 500+ GP starts of experience",
      "Drivers for Audi: Nico Hülkenberg (#27) and Gabriel Bortoleto (#5)",
    ],
  },
  {
    id: "financial",
    title: "Financial Regulations",
    icon: "💰",
    summary: "Cost cap increases significantly to accommodate new regulations.",
    details: [
      "Team operations cost cap increased from $135M to $215M (due to inflation, new regulation development costs, and expanded inclusions)",
      "Separate power unit cost cap increased from $95M to $130M",
      "55% minimum livery coverage mandated — no excessive bare carbon bodywork",
      "Driver cooling vests now mandatory in heat hazard conditions",
    ],
    comparison: [
      { label: "Operations cost cap", before: "$135M", after: "$215M" },
      { label: "PU cost cap", before: "$95M", after: "$130M" },
    ],
  },
  {
    id: "other",
    title: "Other Changes",
    icon: "📋",
    summary: "New stewards panel, expanded pre-season testing, livery rules.",
    details: [
      "Out-of-competition stewards panel introduced for time-sensitive decisions",
      "Three pre-season tests instead of one — significant expansion of testing",
      "55% minimum livery coverage rule ensures cars look properly liveried",
      "Mandatory driver cooling vests in heat hazard conditions",
      "No more fastest lap point — removed at end of 2024 season",
    ],
  },
];

// Official FIA 2026 Regulation PDFs — Source: https://www.fia.com/regulation/category/110
// All latest issues published 2025-12-10
export interface RegulationDocument {
  section: string;
  title: string;
  issue: string;
  publishedDate: string;
  pdfUrl: string;
}

export const FIA_REGULATION_DOCUMENTS: RegulationDocument[] = [
  {
    section: "A",
    title: "General Regulatory Provisions",
    issue: "Issue 01",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_a_general_regulatory_provisions_-_iss_01_-_2025-12-10_0.pdf",
  },
  {
    section: "B",
    title: "Sporting Regulations",
    issue: "Issue 04",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_04_-_2025-12-10_0.pdf",
  },
  {
    section: "C",
    title: "Technical Regulations",
    issue: "Issue 15",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_15_-_2025-12-10_0.pdf",
  },
  {
    section: "D",
    title: "Financial Regulations — F1 Teams",
    issue: "Issue 04",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_regulations_-_f1_teams_iss_04_-_2025-12-10_0.pdf",
  },
  {
    section: "E",
    title: "Financial Regulations — Power Unit Manufacturers",
    issue: "Issue 03",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_e_financial_regulations_-_power_unit_manufacturers_-_iss_03_-_2025-12-10_0.pdf",
  },
  {
    section: "F",
    title: "Operational Regulations",
    issue: "Issue 05",
    publishedDate: "2025-12-10",
    pdfUrl: "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_f_operational_-_iss_05_-_2025-12-10_1.pdf",
  },
];

export const FIA_REGULATIONS_SOURCE_URL = "https://www.fia.com/regulation/category/110";
