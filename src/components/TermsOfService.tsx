import React from 'react';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Modal shown on first app start. The user must accept the terms (AGB) to
 * continue; declining closes the application.
 */
export const TermsOfService: React.FC<Props> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-[#1B2126] border border-wa-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-[#202C33] border-b border-wa-border">
          <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Allgemeine Geschäftsbedingungen</h2>
            <p className="text-[#8696A0] text-xs">Bitte lesen und akzeptieren Sie die folgenden Bedingungen</p>
          </div>
        </div>

        {/* Scrollable terms text */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-[#E9EDEF] leading-relaxed space-y-4 scrollbar-thin">
          <p className="text-[#8696A0] text-xs">Stand: Januar 2026 · Version 1.0.0</p>

          <Section title="1. Geltungsbereich und Vertragsparteien">
            Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") regeln die Nutzung der
            Desktop-Anwendung LetsChat (nachfolgend „App") zwischen dem LetsChat Team
            (nachfolgend „Anbieter") und Ihnen als Nutzer (nachfolgend „Nutzer"). Mit der
            Installation und Nutzung der App erkennen Sie diese AGB als verbindlich an.
          </Section>

          <Section title="2. Leistungsbeschreibung">
            LetsChat ist ein kostenfreier Desktop-Messenger für Windows. Die App ermöglicht den
            Austausch von Textnachrichten und Mediendateien. Alle Nachrichten werden Ende-zu-Ende
            verschlüsselt (AES-GCM). Der Anbieter stellt die App unentgeltlich zur Verfügung; ein
            Anspruch auf einen bestimmten Funktionsumfang besteht nicht.
          </Section>

          <Section title="3. Registrierung und Nutzerkonto">
            Zur Nutzung ist die Einrichtung eines Nutzerkontos mit Benutzername und Passwort
            erforderlich. Der Nutzer ist verpflichtet, sein Passwort geheim zu halten und vor dem
            Zugriff Dritter zu schützen. Der Nutzer ist für sämtliche Aktivitäten verantwortlich,
            die über sein Konto erfolgen. Bei Verdacht auf Missbrauch ist das Passwort
            unverzüglich zu ändern.
          </Section>

          <Section title="4. Erlaubte und verbotene Nutzung">
            Die App darf ausschließlich für rechtmäßige Zwecke genutzt werden. Untersagt sind
            insbesondere:
            <ul className="list-disc list-inside mt-2 space-y-1 text-[#B0BEC5]">
              <li>der Versand von unerwünschter Werbung oder Massennachrichten (Spam),</li>
              <li>die Verbreitung illegaler, rechtswidriger oder jugendgefährdender Inhalte,</li>
              <li>Belästigung, Bedrohung oder Mobbing anderer Personen (Harassment),</li>
              <li>die Verbreitung von Schadsoftware (Malware, Viren, Trojaner),</li>
              <li>jede Handlung, die geeignet ist, die Funktion der App zu beeinträchtigen.</li>
            </ul>
          </Section>

          <Section title="5. Datenschutz und Datenspeicherung">
            Sämtliche Nachrichten und Einstellungen werden ausschließlich lokal in einer
            SQLite-Datenbank auf dem Gerät des Nutzers gespeichert. Es findet keine Speicherung in
            einer Cloud statt. Der Anbieter gibt keine Daten an Dritte weiter. Alle Nachrichten
            werden mit AES-GCM verschlüsselt. Der Nutzer ist selbst für die Sicherung seiner
            lokalen Daten verantwortlich.
          </Section>

          <Section title="6. Haftungsausschluss und Gewährleistung">
            Die App wird „wie besehen" und ohne jegliche Gewährleistung bereitgestellt. Der
            Anbieter haftet nicht für Schäden, die aus der Nutzung oder Nichtverfügbarkeit der App
            entstehen, soweit dies gesetzlich zulässig ist. Eine Haftung für Vorsatz und grobe
            Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der
            Gesundheit bleibt unberührt.
          </Section>

          <Section title="7. Verfügbarkeit des Dienstes">
            Der Anbieter ist bemüht, die App dauerhaft verfügbar zu halten, übernimmt jedoch keine
            Gewähr für eine ununterbrochene Verfügbarkeit. Wartungsarbeiten, technische Störungen
            oder höhere Gewalt können zu vorübergehenden Einschränkungen führen.
          </Section>

          <Section title="8. Änderungen der AGB">
            Der Anbieter behält sich vor, diese AGB jederzeit zu ändern. Über wesentliche
            Änderungen wird der Nutzer in geeigneter Weise informiert. Die fortgesetzte Nutzung der
            App nach Inkrafttreten der Änderungen gilt als Zustimmung zu den geänderten AGB.
          </Section>

          <Section title="9. Anwendbares Recht">
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            Ist der Nutzer Verbraucher, gelten zwingende verbraucherschützende Vorschriften seines
            Wohnsitzstaates vorrangig.
          </Section>

          <Section title="10. Schlussbestimmungen">
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
            Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen
            Bestimmung tritt die gesetzlich zulässige Regelung, die dem wirtschaftlichen Zweck der
            unwirksamen Bestimmung am nächsten kommt.
          </Section>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#202C33] border-t border-wa-border">
          <button
            onClick={onDecline}
            className="px-5 py-2 rounded-lg text-sm font-medium text-[#8696A0] hover:text-white hover:bg-white/10 transition-colors"
          >
            Ablehnen
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-[#00A884] hover:bg-[#00A884]/90 transition-colors"
          >
            Zustimmen
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <div className="text-[#B0BEC5]">{children}</div>
  </div>
);
