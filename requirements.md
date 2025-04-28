# Anforderungen für die Progressive Web App (PWA) "Zeiterfassung"

## Allgemeine Anforderungen
1. **Plattformunabhängigkeit:**  
   Die Anwendung soll als Progressive Web App (PWA) entwickelt werden, um auf allen Geräten (Desktop, Tablet, Smartphone) im Browser lauffähig zu sein, ohne zusätzliche Softwareinstallation.

2. **Offline-Funktionalität:**  
   Die App soll offline nutzbar sein, indem ein Service Worker implementiert wird, der die Ressourcen (HTML, CSS, JavaScript) zwischenspeichert.

3. **Manifest-Datei:**  
   Eine `manifest.json`-Datei soll erstellt werden, um die App als PWA zu registrieren. Diese Datei soll Metadaten wie Name, Icon, Start-URL und Theme-Farbe enthalten.

4. **Keine Server-API:**  
   Die App soll vollständig ohne serverseitige API oder externe Schnittstellen funktionieren. Alle Daten werden lokal im Browser gespeichert.

5. **Datenmanagement:**  
   Zeitstempel und Tagesdaten sollen ausschließlich im Browser gespeichert werden, z. B. mit `localStorage` oder `IndexedDB`.

---

## Funktionale Anforderungen
1. **Datum-Navigation:**  
   - Es sollen Buttons für die Navigation zwischen Tagen (`<` und `>`) vorhanden sein.  
   - Das aktuelle Datum soll angezeigt werden.  
   - Alle Aktionen beziehen sich immer auf den aktuell ausgewählten Tag.

2. **Zeitstempel hinzufügen:**  
   - Ein Button soll es ermöglichen, neue Zeitstempel hinzuzufügen.  
   - Beim Erstellen eines Zeitstempels wird die aktuelle Uhrzeit als Standardwert gesetzt.  
   - Der erste Zeitstempel eines Tages wird automatisch als **Startstempel** markiert.  
   - Nachfolgende Zeitstempel können ein Label und einen kurzen Kommentar enthalten.  
   - Bereits eingegebene Labels des aktuellen Tages werden zur Wiederverwendung vorgeschlagen.  
   - Ein Startstempel kann jederzeit durch ein einfaches Flag gesetzt werden, um Unterbrechungen zu markieren.
   - Die Eingabe eines Labels ist optional, wobei unlabelierte Zeitstempel in der Zusammenfassung als "Ohne Bezeichnung" erscheinen.

3. **Tageszusammenfassung:**  
   - Die App soll immer die Zeit zwischen zwei aufeinanderfolgenden Zeitstempeln berechnen.
   - Die Zeitdauer zwischen zwei aufeinanderfolgenden Zeitstempeln wird dem Label des **späteren** Zeitstempels zugeordnet.
   - Wenn ein Zeitstempel als Startstempel markiert ist, wird die Zeit zwischen dem vorherigen Zeitstempel und diesem Startstempel nicht berechnet und in der Zusammenfassung ignoriert.
   - Ein Startstempel dient als Beginn einer neuen Zeiterfassungsperiode ohne Verbindung zur vorherigen Zeit.
   - Beispiel:
     * 8:00 (normal) → 9:00 "Arbeit" (normal) → 10:00 "Mittagspause" (normal):
       * Zeit von 8:00-9:00 wird "Arbeit" zugeordnet
       * Zeit von 9:00-10:00 wird "Mittagspause" zugeordnet
     * 8:00 (normal) → 9:00 "Arbeit" (normal) → 12:00 "Mittagspause" (als Startstempel markiert) → 13:00 "Arbeit" (normal):
       * Zeit von 8:00-9:00 wird "Arbeit" zugeordnet
       * Zeit von 9:00-12:00 wird "Mittagspause" zugeordnet
       * Die Zeit zwischen 12:00 und 13:00 wird nicht berechnet und nicht in die Zusammenfassung aufgenommen
   - Die Zeiten sollen unter den jeweiligen Labels zusammengezählt und in einer Übersicht dargestellt werden.

4. **Export und Import von Daten:**  
   - Es soll möglich sein, die Daten eines Tages als `.json`-Datei zu exportieren.  
   - Der Export umfasst immer die Daten des gesamten Tages.  
   - Eine Import-Funktion soll es ermöglichen, die Daten eines Tages aus einer `.json`-Datei zu laden und den aktuellen Tag wiederherzustellen.

---

## Technische Anforderungen
1. **Frontend:**  
   - HTML, CSS und JavaScript sollen verwendet werden.  
   - Die App soll responsive gestaltet sein, um auf verschiedenen Bildschirmgrößen gut auszusehen.

2. **Service Worker:**  
   - Ein Service Worker soll implementiert werden, um die App offline verfügbar zu machen und Ressourcen zu cachen.

3. **Datenmanagement:**  
   - Zeitstempel und Tagesdaten sollen im Browser gespeichert werden (z. B. mit `localStorage` oder `IndexedDB`).

4. **Barrierefreiheit:**  
   - Die App soll barrierefrei gestaltet werden (z. B. durch semantisches HTML und ARIA-Attribute).

---

## Zusätzliche Anforderungen (optional)
1. **Benutzerfreundlichkeit:**  
   - Eine einfache und intuitive Benutzeroberfläche.  
   - Visuelles Feedback bei Aktionen (z. B. Hinzufügen eines Zeitstempels).  
   - Vorschläge für Labels basierend auf bereits eingegebenen Labels des aktuellen Tages.
   - Der "Zeitstempel hinzufügen"-Button soll sich zu "Zeitstempel speichern" ändern, wenn ein bestehender Eintrag bearbeitet wird.

2. **PWA-Features:**  
   - Möglichkeit, die App auf den Startbildschirm zu installieren.  
   - Vollbildmodus, wenn die App gestartet wird.

3. **Datenvalidierung:**  
   - Sicherstellen, dass importierte Daten korrekt und vollständig sind.