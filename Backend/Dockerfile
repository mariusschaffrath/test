# Wir nutzen das offizielle .NET 9 SDK zum Bauen
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiere die Projektdatei und lade Abhängigkeiten
COPY ["AutoscrollerAPI/AutoscrollerAPI.csproj", "AutoscrollerAPI/"]
RUN dotnet restore "AutoscrollerAPI/AutoscrollerAPI.csproj"

# Kopiere den restlichen Code
COPY . .
WORKDIR "/src/AutoscrollerAPI"

# Baue die Anwendung (Release Modus)
RUN dotnet publish "AutoscrollerAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# --- Finales Image für den Raspberry Pi ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Port freigeben
EXPOSE 5089

# Datenbank-Ordner vorbereiten (für Permissions)
RUN mkdir -p /app/data && chmod 777 /app/data

# Starten
ENTRYPOINT ["dotnet", "AutoscrollerAPI.dll"]