import { describe, expect, it } from 'vitest';
import { FOREST_STAGES } from '../../content/forest';
import { seededRng } from '../../core/random';
import { ForestBoard, MAX_STAGE, forestStars, stagePoints, type Dir } from './logic';

/** A 4×4 board from rows of stages (0 = empty), with a fixed RNG for the new seeds. */
function board(rows: number[][], seed = 1): ForestBoard {
  return new ForestBoard(rows.length, seededRng(seed), rows.flat());
}

/** The board's stages as rows, ignoring the new seed a move adds. */
function rowsOf(b: ForestBoard, spawnedId?: number): number[][] {
  const n = b.size;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      const t = b.at(r, c);
      return t && t.id !== spawnedId ? t.stage : 0;
    }),
  );
}

describe('ForestBoard', () => {
  it('starts with two new tiles', () => {
    const b = new ForestBoard(4, seededRng(3));
    expect(b.tiles).toHaveLength(2);
    for (const t of b.tiles) expect([1, 2]).toContain(t.stage);
    expect(b.score).toBe(0);
  });

  it('slides tiles to the edge and merges pairs into the next stage', () => {
    const b = board([
      [1, 1, 0, 0],
      [2, 0, 2, 3],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
    ]);
    const r = b.move('left');
    expect(r.moved).toBe(true);
    expect(rowsOf(b, r.spawned?.id)).toEqual([
      [2, 0, 0, 0],
      [3, 3, 0, 0],
      [0, 0, 0, 0],
      [2, 2, 0, 0],
    ]);
    expect(r.grown).toHaveLength(4);
    expect(r.points).toBe(stagePoints(2) * 3 + stagePoints(3));
    expect(b.score).toBe(r.points);
    expect(r.spawned).not.toBeNull();
  });

  it('merges each tile once per move, starting from the edge it slides to', () => {
    const b = board([
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = b.move('right');
    expect(rowsOf(b, r.spawned?.id)[0]).toEqual([0, 0, 2, 3]);
    const b2 = board([
      [3, 3, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r2 = b2.move('left');
    expect(rowsOf(b2, r2.spawned?.id)[0]).toEqual([4, 4, 0, 0]);
  });

  it.each<[Dir, number[][]]>([
    [
      'up',
      [
        [2, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    [
      'down',
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 1, 0, 0],
      ],
    ],
  ])('moves %s', (dir, expected) => {
    const b = board([
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = b.move(dir);
    expect(rowsOf(b, r.spawned?.id)).toEqual(expected);
  });

  it('does nothing, and adds no seed, when nothing can slide', () => {
    const b = board([
      [1, 2, 0, 0],
      [3, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = b.move('left');
    expect(r.moved).toBe(false);
    expect(r.spawned).toBeNull();
    expect(b.tiles).toHaveLength(4);
    expect(b.moves).toBe(0);
  });

  it('reports each stage the first time it is grown', () => {
    const b = board([
      [3, 3, 0, 0],
      [3, 3, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(b.move('left').firsts).toEqual([4]);
    expect(b.highest).toBe(4);
  });

  it('keeps track of the tiles that slid and the ones that merged', () => {
    const b = board([
      [0, 0, 1, 1],
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const ids = b.tiles.map((t) => t.id);
    const r = b.move('left');
    expect(r.grown[0]!.from).toEqual([ids[0], ids[1]]);
    expect(r.grown[0]!.tile).toMatchObject({ stage: 2, row: 0, col: 0 });
    expect(r.slid).toEqual([expect.objectContaining({ id: ids[2], row: 1, col: 0 })]);
  });

  it('ends when the board is full and nothing can merge', () => {
    const b = board([
      [1, 2, 1, 2],
      [2, 1, 2, 1],
      [1, 2, 1, 2],
      [2, 1, 2, 1],
    ]);
    expect(b.canMove()).toBe(false);
    expect(b.over).toBe(true);
    const c = board([
      [1, 2, 1, 2],
      [2, 1, 2, 1],
      [1, 2, 1, 2],
      [2, 1, 2, 2],
    ]);
    expect(c.canMove()).toBe(true);
  });

  it('is won by growing the top stage', () => {
    const b = board([
      [MAX_STAGE - 1, MAX_STAGE - 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = b.move('left');
    expect(b.won).toBe(true);
    expect(b.over).toBe(true);
    expect(r.spawned).toBeNull();
    expect(b.move('right').moved).toBe(false);
  });

  it('is deterministic for a seed', () => {
    const play = () => {
      const b = new ForestBoard(4, seededRng(42));
      const dirs: Dir[] = ['left', 'down', 'right', 'up'];
      for (let i = 0; i < 200 && !b.over; i++) b.move(dirs[i % 4]!);
      return [b.stages, b.score];
    };
    expect(play()).toEqual(play());
  });

  it('can be played a long way by just going round', () => {
    const b = new ForestBoard(4, seededRng(7));
    const dirs: Dir[] = ['down', 'left', 'down', 'right'];
    for (let i = 0; i < 2000 && !b.over; i++) {
      if (!b.move(dirs[i % 4]!).moved) b.move('up');
    }
    expect(b.highest).toBeGreaterThanOrEqual(6);
  });
});

describe('forest scoring', () => {
  it('doubles the points for each stage', () => {
    expect([2, 3, 4, 11].map(stagePoints)).toEqual([4, 8, 16, 2048]);
  });

  it('gives stars for the best stage, asking one more on the big board', () => {
    expect([5, 6, 8, 9, 11].map((s) => forestStars(s, 'normal'))).toEqual([0, 1, 2, 3, 3]);
    expect([6, 7, 9, 10].map((s) => forestStars(s, 'easy'))).toEqual([0, 1, 2, 3]);
  });

  it('has a stage of content for every stage of the game', () => {
    expect(FOREST_STAGES.map((s) => s.stage)).toEqual(
      Array.from({ length: MAX_STAGE }, (_, i) => i + 1),
    );
  });
});
