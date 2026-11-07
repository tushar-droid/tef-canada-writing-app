import { useMemo } from 'react';
import { Mistake } from '../types';

interface AnnotatedEssayProps {
  text: string;
  mistakes: Mistake[];
  activeMistakeId?: string | null;
  onSelectMistake?: (mistakeId: string) => void;
}

interface TextSegment {
  text: string;
  isError: boolean;
  mistake?: Mistake;
}

export function AnnotatedEssay({
  text,
  mistakes,
  activeMistakeId,
  onSelectMistake,
}: AnnotatedEssayProps) {
  const segments = useMemo(() => {
    if (!text || !mistakes || mistakes.length === 0) {
      return [{ text, isError: false }];
    }

    // Find occurrences of all mistake.original phrases
    interface MatchPos {
      start: number;
      end: number;
      mistake: Mistake;
    }

    const matches: MatchPos[] = [];

    for (const m of mistakes) {
      if (!m.original) continue;
      // Strip any accidental quotation marks or guillemets that LLMs might include
      const cleanOriginal = m.original.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim();
      if (cleanOriginal.length === 0) continue;
      
      const searchTarget = cleanOriginal;
      let pos = 0;
      
      while (pos < text.length) {
        const foundIndex = text.indexOf(searchTarget, pos);
        if (foundIndex === -1) break;
        
        matches.push({
          start: foundIndex,
          end: foundIndex + searchTarget.length,
          mistake: m,
        });
        
        pos = foundIndex + searchTarget.length;
      }
    }

    if (matches.length === 0) {
      return [{ text, isError: false }];
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Filter out overlapping matches
    const nonOverlapping: MatchPos[] = [];
    let lastEnd = -1;

    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // Construct text segments
    const result: TextSegment[] = [];
    let cursor = 0;

    for (const m of nonOverlapping) {
      if (m.start > cursor) {
        result.push({
          text: text.slice(cursor, m.start),
          isError: false,
        });
      }

      result.push({
        text: text.slice(m.start, m.end),
        isError: true,
        mistake: m.mistake,
      });

      cursor = m.end;
    }

    if (cursor < text.length) {
      result.push({
        text: text.slice(cursor),
        isError: false,
      });
    }

    return result;
  }, [text, mistakes]);

  return (
    <div className="annotated-essay-body">
      {segments.map((seg, idx) => {
        if (!seg.isError || !seg.mistake) {
          return <span key={idx} className="plain-text-segment">{seg.text}</span>;
        }

        const m = seg.mistake;
        const freqClass = m.frequencyTag || 'medium';
        const isActive = activeMistakeId === m.id;

        return (
          <span
            key={idx}
            className={`annotated-error-span ${freqClass} ${isActive ? 'active-highlight' : ''}`}
            onClick={() => onSelectMistake && onSelectMistake(m.id)}
            title={`Cliquez pour inspecter : ${m.category} (➔ ${m.correction})`}
          >
            {seg.text}
          </span>
        );
      })}
    </div>
  );
}
