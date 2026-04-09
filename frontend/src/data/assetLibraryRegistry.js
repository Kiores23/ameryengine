export const ASSET_LIBRARY_FOLDERS = [
  {
    id: "basic-shapes",
    label: "Basic Shapes",
    type: "folder",
    items: [
      // ─── Standard ───────────────────────────────────────────────
      { id: "box", label: "Box", model: "box" },
      { id: "sphere", label: "Sphere", model: "sphere" },
      { id: "cylinder", label: "Cylinder", model: "cylinder" },
      { id: "cone", label: "Cone", model: "cone" },
      { id: "plane", label: "Plane", model: "plane" },
      { id: "disc", label: "Disc", model: "disc" },

      // ─── Polyhedra ───────────────────────────────────────────────
      { id: "tetrahedron", label: "Tetrahedron", model: "tetrahedron" },
      { id: "octahedron", label: "Octahedron", model: "octahedron" },
      { id: "icosahedron", label: "Icosahedron", model: "icosahedron" },
      { id: "dodecahedron", label: "Dodecahedron", model: "dodecahedron" },

      // ─── Prisms ──────────────────────────────────────────────────
      { id: "pyramid", label: "Pyramid", model: "pyramid" },
      { id: "tri_prism", label: "Tri Prism", model: "tri_prism" },
      { id: "hex_prism", label: "Hex Prism", model: "hex_prism" },
      { id: "pillar", label: "Pillar", model: "pillar" },
      { id: "spike", label: "Spike", model: "spike" },
      { id: "truncated_cone", label: "Truncated Cone", model: "truncated_cone" },

      // ─── Torus / Arcs ────────────────────────────────────────────
      { id: "torus", label: "Torus", model: "torus" },
      { id: "torus_thick", label: "Torus Thick", model: "torus_thick" },
      { id: "ring", label: "Ring", model: "ring" },
      { id: "arc_half", label: "Arc Half", model: "arc_half" },
      { id: "arc_quarter", label: "Arc Quarter", model: "arc_quarter" },

      // ─── Custom ──────────────────────────────────────────────────
      { id: "crystal", label: "Crystal", model: "crystal" },
      { id: "ramp", label: "Ramp", model: "ramp" },
    ],
  },

  {
    id: "portfolio",
    label: "Portfolio Nodes",
    type: "folder",
    color: "blue",
    items: [
      // ─── Identity ───────────────────────────────────────────────
      { id: "obj_who_i_am", label: "Who I Am", model: "who_i_am", category: "Identity" },
      { id: "obj_philosophy", label: "Philosophy", model: "philosophy", category: "Identity" },
      { id: "obj_interests", label: "Interests", model: "interests", category: "Identity" },

      // ─── Skills > Main Categories ───────────────────────────────
      { id: "obj_skill_gameplay", label: "Gameplay Systems", model: "skill_gameplay", category: "Skills" },
      { id: "obj_skill_ai", label: "AI Systems", model: "skill_ai", category: "Skills" },
      { id: "obj_skill_architecture", label: "Engine / Architecture", model: "skill_architecture", category: "Skills" },
      { id: "obj_skill_math", label: "Mathematics & 3D", model: "skill_math", category: "Skills" },
      { id: "obj_skill_network", label: "Networking", model: "skill_network", category: "Skills" },

      // ─── Skills > Engines ──────────────────────────────────────
      { id: "obj_skill_unreal", label: "Unreal Engine", model: "skill_unreal", category: "Skills - Engines" },
      { id: "obj_skill_unity", label: "Unity", model: "skill_unity", category: "Skills - Engines" },
      { id: "obj_skill_godot", label: "Godot", model: "skill_godot", category: "Skills - Engines" },

      // ─── Skills > Languages ────────────────────────────────────
      { id: "obj_skill_c", label: "C", model: "skill_c", category: "Skills - Languages" },
      { id: "obj_skill_cpp", label: "C++", model: "skill_cpp", category: "Skills - Languages" },
      { id: "obj_skill_csharp", label: "C#", model: "skill_csharp", category: "Skills - Languages" },
      { id: "obj_skill_python", label: "Python", model: "skill_python", category: "Skills - Languages" },
      { id: "obj_skill_js", label: "JavaScript", model: "skill_js", category: "Skills - Languages" },
      { id: "obj_skill_blueprints", label: "Blueprints", model: "skill_blueprints", category: "Skills - Languages" },

      // ─── Tools ─────────────────────────────────────────────────
      { id: "obj_skill_git", label: "Git", model: "skill_git", category: "Tools" },
      { id: "obj_skill_perforce", label: "Perforce", model: "skill_perforce", category: "Tools" },
      { id: "obj_skill_rider", label: "Rider", model: "skill_rider", category: "Tools" },
      { id: "obj_skill_blender", label: "Blender", model: "skill_blender", category: "Tools" },

      // ─── Experiences > Education ────────────────────────────────
      { id: "obj_exp_42", label: "42 School", model: "exp_42", category: "Experiences" },
      { id: "obj_exp_licence", label: "Licence Informatique", model: "exp_licence", category: "Experiences" },
      { id: "obj_exp_ilec", label: "Ilec - Bac STD2A", model: "exp_ilec", category: "Experiences" },

      // ─── Experiences > Internships ───────────────────────────────
      { id: "obj_exp_corys", label: "Corys - Unreal Developer", model: "exp_corys", category: "Experiences" },

      // ─── Projects ───────────────────────────────────────────────
      { id: "obj_project_snapshot", label: "Snapshot System (Unreal)", model: "project_snapshot", category: "Projects" },
      { id: "obj_project_transcendence", label: "ft_transcendence (Online game)", model: "project_transcendence", category: "Projects" },
      { id: "obj_project_ml", label: "Machine Learning Platformer", model: "project_ml", category: "Projects" },
      { id: "obj_project_ggj", label: "Global Game Jam 2026", model: "project_ggj", category: "Projects" },
      { id: "obj_project_amery_engine", label: "Amery Engine", model: "project_amery_engine", category: "Projects" },


      // ─── Other ──────────────────────────────────────────────────
      { id: "obj_other_gm", label: "Game Master (Roleplay)", model: "other_gm", category: "Other" },
    ],
  },

  {
    id: "lights",
    label: "Lights",
    type: "folder",
    color: "yellow",
    items: [
      // ─── Point Lights ────────────────────────────────────────────
      { id: "point_light", label: "Point Light", model: "point_light" },

      // ─── Directional Lights ──────────────────────────────────────
      { id: "directional_light", label: "Directional Light", model: "directional_light" },

      // ─── Spot Lights ─────────────────────────────────────────────
      { id: "spot_light", label: "Spot Light", model: "spot_light" },

      // ─── Ambient / Environment ───────────────────────────────────
      { id: "ambient_light", label: "Ambient Light", model: "ambient_light" },
      { id: "hemisphere_light", label: "Hemisphere Light", model: "hemisphere_light" },
    ],
  },

  {
    id: "ai",
    label: "AI",
    type: "folder",
    color: "green",
    items: [
      { id: "ai_skill_ai", label: "Skill AI", model: "skill_ai" },
      { id: "ai_navmesh", label: "Navmesh", model: "navmesh" },
    ],
  },

  {
    id: "other",
    label: "Other",
    type: "folder",
    items: [
      { id: "ritchie", label: "Ritchie", model: "ritchie" },
      { id: "basketball", label: "Basketball", model: "basketball" },
      { id: "boardgames", label: "Boardgames", model: "boardgames" },
      { id: "couch", label: "Couch", model: "couch" },
      { id: "table", label: "Table", model: "table" },
      { id: "painting", label: "Painting", model: "painting" },
      { id: "trains", label: "Trains", model: "trains" },
      { id: "seat", label: "Seat", model: "seat" },
      { id: "skill_ai_corps", label: "AI Corps", model: "skill_ai_corps" },
    ],
  },
];
