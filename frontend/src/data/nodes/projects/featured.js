export const featuredProjectsSection = [
  {
    id: "proj_snapshot",
    label: "Snapshot System (Unreal)",
    type: "Project",
    section: "Featured Projects",
    icon: "cube",
    target: "project_snapshot",
    tags: ["Unreal Engine", "C++", "Perforce", "Gameplay Systems", "AI Systems", "Engine / Architecture", "Rider", "Corys - Unreal Developer"],
    order: 0,
    description:
      `### Système de sauvegarde en temps réel

J’ai conçu et développé un module Unreal Engine permettant de capturer et restaurer l’état complet d’une simulation 3D en cours d’exécution.

Ce système vise à garantir une reprise cohérente de la simulation dans un environnement dynamique composé de nombreux objets interconnectés.

### Architecture générique et gestion des dépendances

Le projet repose sur une approche générique de la sérialisation, capable de parcourir automatiquement les propriétés des acteurs Unreal afin d’enregistrer leur état sans multiplier les cas spécifiques.

Une attention particulière a été portée à la gestion des dépendances entre objets (références logiques, hiérarchiques et spatiales), nécessitant une restauration en plusieurs phases pour reconstruire correctement les liens entre instances.

### Gestion des IA

Le système assure la continuité du fonctionnement des IA simulées lors de la restauration d’un snapshot.

Cela comprend la récupération de l’état des Blackboards, la reprise correcte de l’exécution des Behavior Trees, ainsi que la cohérence des déplacements sur le NavMesh après reconstruction de la scène.

Concrètement, restaurer deux fois le même snapshot doit conduire au même comportement des entités simulés.

### Optimisation et contraintes temps réel

Dans un contexte industriel où des sauvegardes automatiques doivent s’exécuter régulièrement sans perturber la simulation, j’ai travaillé sur plusieurs axes d’optimisation.

La sélection des objets à sauvegarder a été rendue événementielle via des systèmes de délégués, la construction des données a été parallélisée, et la sérialisation finale s’appuie sur les mécanismes natifs d’archives d’Unreal.

Ces améliorations ont permis de réduire significativement le temps de snapshot, passant de plusieurs secondes à quelques dizaines de millisecondes.

### Robustesse, traçabilité et évolutivité

Afin de faciliter la maintenance et le débogage, j’ai mis en place une organisation hiérarchique des données de sauvegarde ainsi qu’un système de logs dédiés à chaque opération de snapshot ou de restauration.`,
    videoUrls: [
      "https://youtu.be/rOv2g4OztTg",
      "https://youtu.be/6LEmUpMzspI",
    ],
    videoDescriptions: [
      `Présentation du projet UnrSnapshotSystem, réalisé dans le cadre de mon stage à Corys.
      
      ⚠️ Cette vidéo est un extrait de la présentation complète du stage disponible dans la section "Corys - Unreal Developer".`,
      `Demo du UnrSnapshotSystem lors d'une restauration d'un snapshot dans le contexte d'un embarquement de tramway.`],
    imageNames: [
      "UnrSnapshot1.png",
      "UnrSnapshot2.png",
    ],
    imageDescriptions: [
      `Interface graphique de test du système de snapshot, utilisée pour valider les sauvegardes et restaurations en simulation.

Interface logicielle côté code, permettant d’identifier les objets à sauvegarder et de définir les paramètres de sauvegarde.`,
      `Schéma simplifié du pipeline de sauvegarde et restauration, illustrant la sérialisation binaire et l’échange optimisé avec le calculateur central.`
    ],
    autoOpenMedia: true
  },

  {
    id: "proj_transcendence",
    label: "ft_transcendence (Online game)",
    type: "Project",
    section: "Featured Projects",
    icon: "gamepad",
    target: "project_transcendence",
    tags: ["Python", "JavaScript", "Git", "Blender", "Three.js", "React", "Django", "PostgreSQL", "Docker",
      "Gameplay Systems", "AI Systems", "Engine / Architecture","Mathematics & 3D", "Networking",
      "42 School"],
    order: 1,
    description:
      `### Site de jeu en ligne

Conception d’une plateforme multijoueur temps réel permettant de jouer, observer et organiser des matchs de Pong en 3D.

Architecture microservices basée sur React, Three.js, Django et PostgreSQL, déployée via une infrastructure conteneurisée.

Participation en tant que lead technique d’une équipe de 5, avec coordination du développement et conception des systèmes centraux.

### Pong 3D

Implémentation d’un jeu synchronisé côté serveur, garantissant la cohérence des états en temps réel.

Ajout de modifiers dynamiques influençant taille des paddles, dimensions de la map, vitesse et comportement de la balle.

Support des modes contre des bots, contre des joueurs en ligne, 1v1 et 2v2.

### Matchmaking

Conception d’un matchmaking générique et indépendant, triant les joueurs selon mode de jeu, modifiers et ELO caché.

Gestion automatisée de la création des parties, des temps d’attente et d’un agent de supervision chargé de générer les bots et d’enregistrer les scores.

### Tournois

Développement d’un système de tournois dynamiques (4 à 12 joueurs, 1v1 ou 2v2).

Affichage en temps réel des scores, matchs en cours et arbre de tournoi 3D interactif, s’adaptant automatiquement au nombre de participants.

Le système s’appuie sur le matchmaking pour générer et gérer les matchs internes.

### Historique des parties

Stockage régulier des données de match en base PostgreSQL, permettant la consultation des scores, adversaires et modes joués.

Approche orientée résilience, visant à préserver un maximum d’informations en cas d’arrêt imprévu.

### Système utilisateur

Implémentation d’un système de comptes sécurisé avec gestion des mots de passe, vérification email, authentification JWT via cookies et double authentification (2FA).

Ajout d’un système d’amis, de statuts en temps réel et de fonctionnalités d’observation des parties et d’accès à l’historique des matchs.

### Organisation et production

Rôle central dans la structuration technique, le développement des systèmes clés (matchmaking, Pong serveur-side, frontend principal) et la maintenance de l’infrastructure Docker, Django et base de données.

Participation active à l’intégration continue et à l’accompagnement de l’équipe.
`,
    imageNames: [ "TranscendencePong1.png", "TranscendenceChoiceGameMode.png", "TranscendenceChoiceGameModifier.png", "TranscendenceMatchmaking.png",
      "TranscendenceTranscendenceTournois.png", "TranscendencePong2.png", "TranscendenceFriendInvite.png", "TranscendenceFriendStatus.png",
      "TranscendenceHagarrio.png"],
    imageDescriptions: [ "Jeu de pong, mode joueur vs IA sur une île tropicale animée.",
      "Les différents modes de jeu disponibles pour le pong.",
      "Les différents modifiers de jeu disponibles pour le pong.",
      "Système de matchmaking pour trouver des adversaires en ligne.",
      "Final d'un tournoi regroupant 4 joueurs. Le plateau 3D change pour chaque tournoi !",
      "Spectateur de la partie d'un ami affrontant un autre joueur.",
      "Notification de demande d'ami en temps réel.",
      "Affichage du statut d'un ami et possibilité de regarder sa partie en cours.",
      "Un agario-like en 1 contre 1 avec un système de bonus à ramasser sur la map."],
    autoOpenMedia: true

  },

  {
    id: "proj_ml_platformer",
    label: "Machine Learning Platformer",
    type: "Project",
    section: "Featured Projects",
    icon: "brain",
    target: "project_ml",
    tags: ["C#", "Unity", "Git", "Gameplay Systems", "AI Systems"],
    order: 2,
    description:
      `Projet de jeu de plateforme sous Unity intégrant un agent intelligent capable d’apprendre à jouer de manière autonome.

L’objectif était d’expérimenter l’utilisation de techniques de machine learning appliquées au gameplay, afin d’observer l’adaptation progressive du comportement de l’agent face aux obstacles du niveau.`,
  },

  {
    id: "proj_ggj",
    label: "Global Game Jam 2026",
    type: "Project",
    section: "Featured Projects",
    icon: "gamepad",
    target: "project_ggj",
    tags: ["C++", "Blueprints", "Unreal Engine", "Perforce", "Rider", "Gameplay Systems", 
      "AI Systems", "Engine / Architecture", "Mathematics & 3D"],
    order: 3,
    description:
      `## Da Bigboss Exil

Jeu de combat orienté survie face à une horde d’ennemis, reposant sur des interactions physiques marquées, un rythme soutenu et une adaptation de l’équipement et des compétences.

### Rush de 48h

Projet réalisé lors de la Global Game Jam 2026 en équipe de 3 personnes, avec pour objectif de produire un jeu jouable en moins de 48 heures.
Grâce à une expérience plus avancée sur Unreal, j’ai contribué fortement à la mise en place technique, à l’intégration gameplay et à la structuration globale du projet.

### Système de combat et gameplay

Conception d’un système de combat physique basé sur la gestion des hitbox, des impacts et des projections, favorisant la réactivité et la lisibilité des affrontements.

### Équipement & compétences

Intégration de systèmes d’équipement évolutifs, influençant directement les actions disponibles et le style de jeu du joueur.

### IA de la horde d’ennemis

Mise en place d’une IA comportementale fonctionnelle utilisant Blackboards, Behavior Trees et NavMesh, assurant une pression constante et des déplacements cohérents.

### Level design et environnement

Création complète de la map de jeu à partir d’une heightmap, pensée pour optimiser la lisibilité des combats et la fluidité des déplacements.

### Interface utilisateur dynamique

Réalisation d’un HUD évolutif affichant en temps réel vie, compétences et icônes contextuelles liées à l’équipement actif.

### Organisation technique

Mise en place et hébergement d’un serveur Perforce pour la gestion de versions, avec utilisation de Rider comme IDE principal.
Projet réalisé avec deux développeurs et un modélisateur 3D ayant conçu l’ensemble des modèles et animations.

### Expérience et apprentissages

Expérience intense permettant de renforcer les compétences en gameplay Unreal Engine, en production rapide et en travail collaboratif sous contrainte de temps.
`,
    imageNames: [
      "DaBigbossExil1.png",
      "DaBigbossExil2.png",
      "DaBigbossExil3.png",
    ],
     imageDescriptions: [
      `Le véritable Grand Patron erre dans le désert, suivant son chemin vers la vengeance.`,
      `Poussé par la rage, le véritable Grand Patron s'approche du Masque qui alimentera sa vengeance.`,
      `Le Masque de la Peur en sa possession, le Grand Patron prend la fuite – la survie prime désormais sur la vengeance.`,
    ],
     autoOpenMedia: true
  },

  {
    id: "proj_amery_engine",
    label: "Amery Engine",
    type: "Project",
    section: "Featured Projects",
    icon: "gamepad",
    target: "project_amery_engine",
    tags: ["Python", "JavaScript", "Unreal Engine", "Unity", "Three.js","React", "Django", "PostgreSQL", "Docker",
      "Git", "Engine / Architecture", "Mathematics & 3D"],
    order: 4,
    description:
      `### Concept

Amery Engine est un site portfolio interactif conçu comme un véritable moteur de jeu.

Il a été pensé pour refléter ma personnalité créative et technique à travers une expérience immersive qui dépasse la navigation classique d’un site web.

### Profil

Le site présente qui je suis, mes compétences, mes projets ainsi que mon parcours, le tout intégré dans un environnement interactif fidèle à mon univers de développeur orienté game design et programmation.

### Mode édition

Amery Engine propose un mode édition permettant de déplacer et modifier les objets présents dans le viewport, à la manière d’un véritable éditeur de moteur de jeu.

Cette approche met en avant ma façon de concevoir les systèmes : expérimenter, construire et itérer dans un espace vivant.

### Mode démo

Le site intègre également un mode démo en runtime.

Dans ce mode, l’utilisateur peut incarner un personnage capable de se déplacer librement dans le monde tel qu’il a été configuré, créant une transition naturelle entre création et exploration.

### Objectif

Amery Engine est à la fois une expérience interactive et une vitrine de mes compétences techniques et créatives, illustrant ma capacité à concevoir des systèmes complexes inspirés des moteurs de jeu modernes.`,
  }
];