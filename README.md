# Cross-Platform Usage

**Important:** This project is designed for cross-platform development and deployment. All development and deployment scripts are provided as Bash scripts (`.sh`) and are supported on Linux, MacOS, and Windows (using WSL or Git Bash). 

**Deprecated:** The Windows-only scripts (`.ps1`, `.bat`) are deprecated and should not be used. They are kept for legacy/local Windows-only development but are not supported for Docker, Linux, or MacOS environments. Always use the Bash scripts (`start-dev.sh`, `stop-dev.sh`, etc.) for starting, stopping, and deploying the application.

**How to start the project:**

```bash
chmod +x ./start-dev.sh
./start-dev.sh
```

**How to stop the project:**

```bash
chmod +x ./stop-dev.sh
./stop-dev.sh
```

For deployment and production, see the `deployment/README.md` for Linux instructions.

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

