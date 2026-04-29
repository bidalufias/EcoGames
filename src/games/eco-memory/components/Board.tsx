import { Box } from '@mui/material';
import Card from './Card';
import type { CardDef, CardState } from '../engine';

interface BoardProps {
  deck: CardDef[];
  cards: Record<number, CardState>;
  onFlip: (id: number) => void;
  disabled?: boolean;
  /** Number of columns; defaults to a square-ish layout. */
  cols?: number;
}

/**
 * Square, viewport-fitting board. Mirrors the Climate 2048 pattern
 * (`SoloPlay.tsx:163-167`): an `aspectRatio: 1/1` wrapper sits inside a
 * `flex: 1, minHeight: 0` parent, so it always renders as the largest square
 * that fits the leftover space — no overflow on short iPad-landscape layouts.
 */
export default function Board({ deck, cards, onFlip, disabled, cols }: BoardProps) {
  const total = deck.length;
  const columns = cols ?? Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / columns);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: `${columns} / ${rows}`,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: '1fr',
          gap: 'clamp(4px, 1.2cqi, 10px)',
          containerType: 'inline-size',
          padding: 'clamp(2px, 0.8cqi, 8px)',
        }}
      >
        {deck.map(card => (
          <Card
            key={card.id}
            def={card}
            state={cards[card.id]}
            disabled={disabled}
            onClick={() => onFlip(card.id)}
          />
        ))}
      </Box>
    </Box>
  );
}
