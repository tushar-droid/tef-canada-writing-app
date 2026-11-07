import { useState } from 'react';

interface AccentBarProps {
  onInsertChar: (char: string) => void;
}

const LOWERCASE_ACCENTS = [
  'é', 'è', 'ê', 'ë',
  'à', 'â',
  'ù', 'û',
  'ô',
  'î', 'ï',
  'ç',
  'œ', 'æ',
  '«', '»', '’'
];

const UPPERCASE_ACCENTS = [
  'É', 'È', 'Ê', 'Ë',
  'À', 'Â',
  'Ù', 'Û',
  'Ô',
  'Î', 'Ï',
  'Ç',
  'Œ', 'Æ',
  '«', '»', '’'
];

export function AccentBar({ onInsertChar }: AccentBarProps) {
  const [isUpperCase, setIsUpperCase] = useState(false);

  const accents = isUpperCase ? UPPERCASE_ACCENTS : LOWERCASE_ACCENTS;

  return (
    <div className="accent-bar-container">
      <div className="accent-bar-label">
        <span>Accents français :</span>
      </div>

      <div className="accent-keys-list">
        {accents.map((char) => (
          <button
            key={char}
            type="button"
            className="accent-key-btn"
            title={`Insérer ${char}`}
            onMouseDown={(e) => {
              // Prevent losing focus on textarea
              e.preventDefault();
              onInsertChar(char);
            }}
          >
            {char}
          </button>
        ))}

        <button
          type="button"
          className={`accent-key-btn toggle-caps ${isUpperCase ? 'active' : ''}`}
          title="Basculer Majuscules / Minuscules"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsUpperCase(!isUpperCase);
          }}
        >
          {isUpperCase ? '⇧ a' : '⇧ A'}
        </button>
      </div>
    </div>
  );
}
