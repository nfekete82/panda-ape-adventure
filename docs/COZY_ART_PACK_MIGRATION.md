# Wild Valley: einheitlicher Farming-Art-Pack-Wechsel

## Warum die bisherigen Pixel-Änderungen kaum auffallen

Der Hintergrund wird derzeit als große Canvas-Textur in `apps/game/src/environment-art.ts` gezeichnet; die Bäume stammen aus `world-style.ts` und die Farmobjekte aus `valley-art.ts`. Das aktuelle Layout benutzt weiterhin diese drei voneinander getrennten Grafikquellen. Ein paar Dekorationsdetails allein können den Stil deshalb nicht grundlegend verändern.

## Art-Direction-Ziel

- Einheitliche **Top-down-3/4-Ansicht** mit durchgängiger 16×16- oder 32×32-Skalierung.
- Vor allem **ein** kompatibles Hauptpaket für Gras, Wege, Erde, Bäume, Zäune, Gebäude, Dekoration und Pflanzen; keine gemischten Perspektiven.
- Panda und Ape als originale Spielfiguren beibehalten und stilistisch neu zeichnen/anpassen.
- Referenzbild als Kompositions- und Qualitätsziel, keine Kopie von Sprites.

## Kandidaten (Lizenz prüfen, bevor Assets ins Repository gelangen)

1. **Cozy Farm Tileset – bubbabba**: https://bubbabba.itch.io/cozy-farm-tileset — umfangreiches kostenpflichtiges Top-down-Farming-Paket; Kauf und bereitgestellte ZIP-Dateien erforderlich.
2. **Mini Farm – Jofra**: https://jofra.itch.io/mini-farm — kostenlos, CC0 laut Projektseite, aber WIP. Quelle/Lizenztext zusammen mit Assets dokumentieren.
3. **Kenney Tiny Town**: https://kenney.nl/assets/tiny-town — CC0, konsistenter Stil, aber wenige Farming-Items. Eher für Prototyping als für den vollständigen Farming-Look.

Nicht die kostenlosen Varianten anderer kommerzieller Pakete übernehmen, wenn sie nur für nichtkommerzielle Projekte lizenziert sind.

## Technische Migration – erst mit vorhandenen Quelldateien durchführen

1. ZIP-Quelle, Version und Lizenz in `assets/third-party/<pack>/` festhalten. Keine Hotlinks zu externen Bildhosts als Produktionslösung.
2. Mit den vorhandenen `makeAssets()`-/`preload()`-Pipelines eine **separate Pack-Atlas-/Spritesheet-Schicht** einführen, auf die bestehende Renderer zurückgreifen. Fallback zu bisheriger Canvas-Kunst nur für noch nicht ersetzte Elemente.
3. `paintForestWorld()` durch eine tilebasierte Terrain-Komposition (Boden, Wege, Ufer, Wasser) mit denselben autoritativen Weltmaßen ersetzen.
4. Bäume und Felsen in `main.ts` müssen weiterhin denselben Indizes von `obstacles` entsprechen; Fällen, Stümpfe und Hindernisse müssen konsistent bleiben.
5. `valley-view.ts` und `valley-art.ts` auf tatsächliche Farm-Tile-Texturen (trocken, nass, Wachstumsstufen, Gebäude, Drops) umstellen. `FARM`-Zellen und Gameplay-Koordinaten unverändert lassen.
6. Pixelgenaue Skalierung, transparenter Spriterand, Ankerpunkte, Sortiertiefe, 1×/2×/Retina, Regen-Overlay und Hitboxen in Solo/Koop prüfen.
7. Echte Bilder in Browser-Screenshots vergleichen und erst nach funktionierender vollständiger Szene den prozeduralen Altstil entfernen.

## Akzeptanzkriterien

- Ein klar erkennbarer, nicht nur partiell veränderter visueller Stil im ersten Bildschirm (Gras, Wege, Wasser, Bäume und Hof).
- Keine fremden geschützten Sprites aus dem Referenzbild.
- Bestehende Savegames, Multiplayer, Pfadsuche, Bäume, Drops und Farming bleiben funktional.
- `npm run build`, die Repo-Tests, Browser-Checks und Docker-Build müssen nach der Umstellung grün sein.

**Status:** Dies ist die technische Migrationsplanung, keine Behauptung, das eigentliche Grafikpaket sei bereits integriert.
