# ProPra_WiSe_25-26_Gruppe_9

Frontend (Angular) – enthält das eigentliche Spiel (Autoscroller mit Hindernissen, Items, Leben & Punkten) sowie das Leaderboard.

Backend (ASP.NET Core Web API) – speichert Highscores dauerhaft und stellt sie über eine REST-API bereit.

Das Projekt ist so aufgebaut, dass Frontend und Backend unabhängig voneinander entwickelt und deployed werden können.

--Projektstruktur--

/project-root
│
├── /frontend/                          # Angular-App (Spiel & Leaderboard)
│   ├── /src/
│   │   ├── /app/
│   │   │   ├── /core/                  # Services, Interceptors, globale Funktionen
│   │   │   ├── /shared/                # Reusable Components, Models
│   │   │   ├── /pages/
│   │   │   │   ├── /start/             # Startscreen
│   │   │   │   ├── /game/              # Spiel-Ansicht & Spiellogik
│   │   │   │   └── /leaderboard/       # Leaderboard-Ansicht
│   │   │   ├── app.module.ts
│   │   │   └── app.routes.ts
│   │   └── index.html
│   ├── angular.json
│   ├── package.json
│   └── README.md
│
├── /backend/                           # ASP.NET Core Web API
│   ├── /Controllers/
│   │   └── HighscoresController.cs
│   ├── /Models/
│   │   └── HighscoreEntry.cs
│   ├── /Data/
│   │   └── ApplicationDbContext.cs
│   ├── /Services/
│   │   └── HighscoreService.cs
│   ├── appsettings.json
│   ├── Program.cs
│   └── README.md
│
├── ProPra_WiSe_25-26_Gruppe_9-sln      # Workspace-Datei
└── README.md                           # Dieses Dokument

