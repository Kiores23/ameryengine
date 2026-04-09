import { languagesSection } from "./languages";
import { enginesSection } from "./engines";
import { toolsSection } from "./tools";

const skillsNodes = [

{
  id: "skill_gameplay",
  label: "Gameplay Systems",
  type: "Skill",
  icon: "sliders",
  target: "skill_gameplay",
  tags: ["ft_transcendence (Online game)", "Global Game Jam 2026",
     "Corys - Unreal Developer",  "42 School",
     "Game Master (Roleplay)"],
  order: 0,
  description: `
### Conception de systèmes de jeu
Je conçois des **systèmes de gameplay modulaires** basés sur des règles et des interactions entre mécaniques. Mon approche repose sur la création de **boucles de jeu claires**, de systèmes interconnectés et d'une structure permettant d'ajouter facilement de nouvelles mécaniques.

### Projets et expérimentations
J’ai développé plusieurs systèmes de gameplay, notamment un **jeu de Pong en 3D** dans le cadre de *ft_transcendence*.  
Lors de la **Global Game Jam 2026**, j’ai également participé à la création d’un **jeu de combat inspiré des Survivor**.

### Maître de jeu
En dehors du développement, je **crée et anime** des univers de jeu de rôle en tant que maître de jeu.
J’y conçois des **règles**, **mécaniques** et **situations** de jeu afin de proposer des **expériences interactives** aux joueurs.
`
},

{
  id: "skill_ai",
  label: "AI Systems",
  type: "Skill",
  icon: "chip",
  target: "skill_ai",
  tags: ["Unreal Engine", "Unity", "Snapshot System (Unreal)", "Machine Learning Platformer", "ft_transcendence (Online game)", "Global Game Jam 2026", "Corys - Unreal Developer", "42 School"],
  order: 1,
  description: `
### Corys — IA de simulation
Lors de mon stage chez **Corys**, j’ai travaillé sur un système de **sauvegarde et restauration d’IA** dans une simulation ferroviaire.  
Cela impliquait la gestion d’éléments comme les **voyageurs**, leurs **Blackboards**, **Behavior Trees** et leur navigation via le **NavMesh**.

### Machine Learning
J’ai également expérimenté l’IA via un **projet de platformer en machine learning** sous Unity, réalisé en binôme. L’objectif était de créer des agents capables d’apprendre à naviguer et optimiser leurs déplacements.

### IA de jeu
Dans **ft_transcendence**, j’ai développé un **algorithme capable d’affronter le joueur au Pong**, permettant de proposer un adversaire automatisé.
`
},

{
  id: "skill_architecture",
  label: "Engine / Architecture",
  type: "Skill",
  icon: "cpu",
  target: "skill_architecture",
  tags: ["C++", "C#", "C", "Unreal Engine", "Unity", "Snapshot System (Unreal)", "ft_transcendence (Online game)", "Amery Engine", "Corys - Unreal Developer", "42 School"],
  order: 2,
  description: `
### Corys — Architecture moteur
Lors de mon stage chez **Corys**, j’ai développé un **Snapshot System** permettant de sauvegarder et restaurer l’état complet d’une simulation.  
Ce travail m’a amené à comprendre en profondeur le fonctionnement des **objets Unreal**, de leurs **propriétés**, de leurs **références** et de leur sérialisation.

### Conception de systèmes
Ce système devait s’intégrer directement à l’architecture moteur et manipuler différents types d’acteurs et de données, ce qui m’a permis de travailler sur des **structures modulaires proches du moteur lui-même**.

### Backend de jeu
Dans **ft_transcendence**, j’ai conçu un **système de matchmaking avancé** incluant un **classement ELO**, des **files d’attente par mode de jeu**, la gestion des parties et la **sauvegarde des scores**.
`
},

{
  id: "skill_math",
  label: "Mathematics & 3D",
  type: "Skill",
  icon: "vector",
  target: "skill_math",
  tags: ["C++", "C#", "C", "Python", "Unreal Engine", "Unity", "Blender", "Snapshot System (Unreal)", "Global Game Jam 2026", "Amery Engine", "42 School", "University - Licence Informatique"],
  order: 3,
  description: `
### Mathématiques 3D
Utilisation de **vecteurs**, **matrices**, **transformations** et **quaternions** pour manipuler positions, rotations et directions dans des environnements 3D.

### Simulation
Application de ces notions à la **simulation physique**, aux déplacements, aux collisions et à différents calculs spatiaux utilisés dans le gameplay et les systèmes de jeu.

### Rayons et intersections
Utilisation de **calculs de rayons**, d’**intersections** et de principes proches du **raytracing** pour des besoins liés au rendu, à la détection et à l’analyse de l’espace 3D.
`
},

{
  id: "skill_network",
  label: "Networking",
  type: "Skill",
  icon: "network",
  target: "skill_network",
  tags: ["ft_transcendence (Online game)", "Python", "JavaScript", "42 School"],
  order: 4,
  description: `
### Jeu en ligne — ft_transcendence
J’ai développé un **jeu de Pong exécuté côté serveur** afin de garantir une exécution fiable et éviter la triche. Le serveur gérait la logique de jeu et synchronisait les clients.

### Infrastructure réseau
Le projet reposait sur **Python / Django**, avec un système **WebSocket temps réel** pour la communication entre les joueurs, la vérification des utilisateurs et la gestion des parties en direct.

### Supervision des parties
Le système incluait également un **agent serveur chargé de surveiller les parties**, vérifier leur bon déroulement et enregistrer les résultats.
`
}

];

export const skillsType = [
  ...languagesSection,
  ...enginesSection,
  ...toolsSection,
  ...skillsNodes
];