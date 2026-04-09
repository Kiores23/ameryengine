export const OUTLINER_TYPES = [
  {
    key: "Identity",
    label: "Identity",
    order: 0,
    open: true,
  },
  {
    key: "Skill",
    label: "Core Skills",
    order: 1,
    open: false,
  },
  {
    key: "Project",
    label: "Projects",
    order: 2,
    open: true,
  },
  {
    key: "Experience",
    label: "Experiences",
    order: 3,
    open: false,
  },
  {
    key: "Other",
    label: "Other",
    order: 4,
    open: false,
  },
];

export const OUTLINER_SECTIONS = [
  // ───────────── Skill ─────────────
  {
    type: "Skill",
    key: "Languages",
    label: "Languages",
    order: 0,
    open: false,
  },
  {
    type: "Skill",
    key: "Engines",
    label: "Engines",
    order: 1,
    open: false,
  },
  {
    type: "Skill",
    key: "Tools",
    label: "Tools",
    order: 2,
    open: false,
  },
  // ───────────── Project ─────────────

  {
    type: "Project",
    key: "Featured Projects",
    label: "Featured Projects",
    order: 0,
    open: true,
  },

  {
    type: "Project",
    key: "Academic Projects",
    label: "Academic Projects",
    order: 1,
    open: false,
  },

  // ───────────── Experience ─────────────
  {
    type: "Experience",
    key: "Internships",
    label: "Internships",
    order: 0,
    open: true,
  },
  {
    type: "Experience",
    key: "Education",
    label: "Education",
    order: 1,
    open: true,
  },
];