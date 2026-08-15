# Architekturrichtlinie für KI-Agenten

Diese Datei dient als verbindliche Leitlinie für alle Code-Änderungen in diesem Repository. Sie beschreibt die vorhandene Architektur, das erwartete Design und die Sicherheits- und Qualitätsanforderungen, damit eine KI konsistente, kleine und wartbare Änderungen umsetzen kann.

## 1. Projektziel

Das Repository implementiert einen Importer für tabellarische Daten aus Clipboard/Excel/CSV in eine MSSQL-Datenbank. Die zentrale Architektur ist:

- Backend als TypeScript-Express-Service mit SQL-Interaktion und Authentifizierung
- Frontend als Angular-App für Bedienung und Validierung
- Backend stellt das Frontend im Produktionsmodus als statische Dateien bereit
- Sicherheitsmechanismen sind Teil der Anwendungslogik und nicht optional

Das System soll besonders robust gegen falsche Daten, unsichere Anfragen und unzulässige Nutzerzugriffe sein.

## 2. Technologiestack

### Backend
- TypeScript
- Node.js
- Express
- ESM-Module (`"type": "module"`)
- `mssql` für Datenbankzugriff
- `express-validator` für Validierung
- Sicherheits-Middleware für Origin-Checks, CSRF, Rate-Limits, Request-Context

### Frontend
- Angular
- TypeScript
- RXJS
- Dev-Server mit Proxy zu `/api/*`

### Teststrategie
- Backend-Tests mit Node/TypeScript Test-Runner
- Frontend-Tests mit Angular/Vitest-Umgebung
- Fokus auf echte Verhaltens- und Integrationsszenarien statt Mock-Only-Assertions

## 3. Architekturelle Grundprinzipien

### 3.1 Separation of Concerns

Die Aufteilung folgt klaren Schichten:

- `src/app.ts`: globale App-Konstruktion, Middleware-Registrierung, Routen-Setup
- `src/routes/*`: HTTP-Routing und Parameter-Validierung; keine Geschäftslogik
- `src/controllers/*`: Request/Response-Orchestrierung; Daten auslesen, Services aufrufen, Antworten senden
- `src/services/*`: Business-Logic, fachliche Regeln, Ablaufkontrolle, Validierung und Import-Logik
- `src/repositories/*`: Datenbankzugriff und SQL-Abfragen
- `src/models/*`: Typen, DTOs, Rest-Modelle, Domain-Objekte
- `src/middleware/*`: Sicherheits- und Kontext-Middleware
- `src/config/*`: Umgebung, Laufzeit-Config, Validierung
- `src/utils/*`: Hilfsfunktionen, Logger, Metadaten-Helper, allgemeine Utilities

Bei Änderungen immer derselben Schicht treu bleiben. Eine Controller-Funktion darf keine SQL-Logik enthalten. Eine Repository-Datei darf keine HTTP-Response-Logik enthalten.

### 3.2 Kleine, explizite Migrations

- Keine breiten Refactorings ohne konkreten Zweck
- Funktionen und Klassen sollen fachlich klar benannt sein
- Für neue Features kleine, lokale Änderungen vorziehen
- Bestehende Struktur nicht „umdekorieren“, wenn das Problem lokal gelöst werden kann

### 3.3 Typ-Sicherheit und klare Contracts

- TypeScript-Typen sind verbindlich und sollten erweitert werden, wenn neue Datenmodelle eingeführt werden
- `Request`, `Response`, `HttpError`, DTOs und Domain-Modelle sollen sauber genutzt werden
- Neue API-Contracts müssen konsistent zwischen Backend, OpenAPI und Frontend gepflegt werden

### 3.4 Keine unkontrollierten Fehlerpfade

Fehler werden nicht einfach „durchgereicht“, sondern semantisch gemappt:

- `HttpError` für kontrollierte API-Fehler
- `logger` für structured logging
- Import-Resultate werden in einem klaren Status modelliert (`success`, `failed_validation`, `failed_internal`)
- Interne Fehler sollen nicht unangemessen als 5xx-Detail an den Client zurücklaufen

## 4. Backend-Architektur

### 4.1 Grundgerüst

Die zentralen App-Hooks liegen in `backend/src/app.ts`:

- `app.disable('x-powered-by')`
- `setSecurityHeaders` global
- NTLM-Authentication optional abhängig von `AUTH_MODE`
- Routen unter `/api/v1` registrieren
- Sicherheits-Middleware für unsichere Methoden (Origin-Protection, CSRF, Rate-Limit)
- Fehler-Handler am Ende der Middleware-Kette

Die Reihenfolge der Middleware ist wichtig:

1. Request-Context / Request-ID setzen
2. Authentifizierung/Authorization prüfen
3. Origin-Checks und CSRF für unsichere Methoden
4. Rate-Limits bei Schreiboperationen
5. Route-Handler
6. Globaler Error-Handler

### 4.2 Route- und Controller-Muster

Die vorhandene Struktur folgt einem klaren Muster:

- Route definiert die URL und delegiert an Controller-Funktionen
- Controller liest Request-Daten, ruft Services auf und beantwortet mit JSON
- Service enthält fachliche Validierungslogik
- Repository kapselt Zugriff auf SQL/DB

Neues Verhalten muss diesem Muster folgen. Eine Route darf nicht direkt auf die Datenbank oder auf unstrukturierte Logik zugreifen.

### 4.3 Authentifizierung und Autorisierung

Das Backend unterstützt ausdrücklich:

- `AUTH_MODE=ntlm` für Windows-Authentifizierung
- `AUTH_MODE=none` nur für lokale Entwicklung / Test
- Autorisierung über eine spezielle Tabelle, z. B. `_Authorizations`

Wichtige Regeln:

- `AUTH_MODE=none` darf nie unbeaufsichtigt in Produktion verwendet werden
- Nutzerbezogene Informationen aus NTLM sollten sauber in `req.userName` / `req.userName`-ähnlichen Kontexten verarbeitet werden
- Zugriffsprüfung darf nicht in Routes selbst erfolgen, sondern in Authorization-Middleware bzw. Services

### 4.4 Import- und Validierungsfluss

Das Kerngeschäft des Projekts ist der Datenimport. Der Ablauf ist bewusst in mehrere Stufen aufgeteilt:

- Spalten- und Tabellen-Metadaten laden
- Typ-/Formatprüfung vorbereiten
- Preview-Dry-Run laufen lassen
- Validierungsfehler im Resultat anzeigen
- Commit nur nach erfolgreicher Validierung

Die Import- und Audit-Logik muss erhalten bleiben:

- `requestId` für Korrelation
- `userName` für Nachvollziehbarkeit
- `operation` (`preview` / `commit`)
- `schemaName`, `tableName`, `rowCount`
- `rowsInserted` und Status

## 5. Frontend-Architektur

### 5.1 Frontend-Role

Das Frontend ist UI-Schicht und Daten-Validierung am Client, nicht die primäre Sicherheitsbarriere. Es dient:

- Tabellen-/Schema-Auswahl
- Spalten-Metadaten anzeigen
- CSV-/Clipboard-Daten einlesen
- Vorvalidierung und Fehleranzeige
- Import-Trigger

### 5.2 Produktionsmodus

Im Produktions-Setup dient das Backend als Host für die gebaute Angular-Frontend-Ansicht. Das Frontend darf nicht als eigenständige App mit eigener Businesslogik im Backend interpretiert werden; Produktiv- und Dev-Modi müssen kompatibel bleiben.

### 5.3 API Contracts

Die Frontend-Integration basiert auf stabilen Data Contracts. Insbesondere gilt für Spalten-Metadaten:

- Backend-neutraler Contract mit `constraints`
- `logicalTypes` statt vendor-spezifischer Typen bevorzugen
- Fallbacks nur für Legacy-Kompatibilität akzeptieren

Ein neuer Backend-Datentyp sollte grundsätzlich zuerst im generischen Contract modelliert werden, nicht als Frontend-Hack.

## 6. Sicherheitsrichtlinien

Diese Regeln sind bindend:

- Origin allow list für unsichere HTTP-Methoden
- CSRF-Schutz für mutierende Requests
- Rate-Limits für Schreiboperationen
- sichere Header via Security Middleware
- keine direkten SQL-Statements aus Controllern/Routes
- keine Verarbeitung von untrusted input ohne Validierung
- keine Datenschutz-/Audit-Logik unterdrücken, wenn DB-Importe ausgelöst werden

Besonders wichtig:

- `AUTH_MODE=none` nur lokal oder in speziell gekennzeichneten Testumgebungen
- keine Freigabe interner Fehlerdetails an Clients
- keine Öffnung von Admin-/Metadaten-Endpunkten für unautorisierte Nutzer

## 7. Konventionen für neue Änderungen

### 7.1 Wenn du eine neue Route ergänzt
- Route im passenden `routes/*.routes.ts` definieren
- Controller-Funktion in passendem `controllers/*.controller.ts` anlegen
- Business-Logik in `services/*.service.ts` verschieben
- SQL-Zugriffe in `repositories/*.repository.ts`
- DTO/Typ in `models` ergänzen
- API-Response und Error-Handling konsistent halten

### 7.2 Wenn du neue DB-Logik ergänzt
- Repository-Muster beibehalten
- keine SQL-Strings im Controller bauen
- Parameterisierung und sichere SQL-Konstruktion bevorzugen
- keine Tabellen-/Schema-Namen ohne Validierung aus raw inputs übernehmen

### 7.3 Wenn du eine API erweitert
- OpenAPI/Dokumentation in `openapi.yaml` aktualisieren
- Typ-Contract im Backend und Frontend berücksichtigen
- Frontend-Validierung und Backend-Validierung logisch abstimmen

### 7.4 Wenn du Sicherheitslogik änderst
- Auswirkungen auf CORS, CSRF, Autorisierung und Request-Context prüfen
- keine Sicherheitsprüfungen „nur im Frontend“ setzen
- Änderungen so minimal wie möglich, aber vollständig im Back-End-Stack verankern

## 8. Test- und Qualitätsanforderungen

- Vor einem Fix eine nachvollziehbare Ursache bestimmen
- Relevante Tests vor dem Patch ausführen, wenn vorhanden
- Keine Mock-Assertions auf reine Mock-Befehle ersetzen echte Verhaltenstests
- Bei API-Änderungen die betroffenen Backend-/Frontend-Tests mitlaufen lassen
- Neue Funktionen ohne passende Prüfung nicht einbauen

Empfohlene Prüfungsbefehle:

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- Lokaler Backend-Dev-Run: `cd backend && npm run dev:local`
- Frontend-Dev-Run: `cd frontend && npm run start`

## 9. Entscheidungshilfe für KI-Agenten

Wenn ein Vorschlag zwischen mehreren Architekturoptionen unsicher ist, bevorzugt die Anwendung diese Reihenfolge:

1. Bestehende Schichtung und Namenskonventionen beibehalten
2. Kleinste, lokale Änderung mit klarer Kapselung
3. Sicherheits- und Validierungsregeln nicht umgehen
4. API-Contracts konsistent erweitern
5. Tests/Verifikation nach der Änderung ergänzen

## 10. Verbotene Muster

Die KI darf diese Muster in diesem Projekt nicht reproduzieren:

- Controller mit direkte SQL-Zugriffen
- Frontend-Only-Sicherheitsprüfung statt Backend-Sicherung
- unstrukturierte Fehlerausgabe oder Dev-Details im Produktivpfad
- Überschreiben bestehender API-Contracts ohne Gegenprüfung
- Einführung neuer Abhängigkeits- oder Architekturpatterns ohne Notwendigkeit
- breite, unübersichtliche Refactorings ohne Ziel

## 11. Kurzform für Agenten

Wenn du in diesem Repo arbeitest:

- halte dich an die bestehende Schichtstruktur
- erweitere keine Verantwortlichkeiten über die Schichten hinweg
- sichere alle mutierenden Endpunkte mit den vorhandenen Sicherheitsmechanismen
- behandle Datenvalidierung und Audit-Logging wie ein Kernfeature
- halte Änderungen klein, typisiert und verifizierbar

Das Ziel ist ein robustes, leicht verständliches Backend-Frontend-System, das auf sichere, gut dokumentierte und prüfbare Importspezifikationen setzt.
