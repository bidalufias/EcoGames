import { describe, expect, it } from 'vitest';
import { seededRng } from '../../core/random';
import {
  E,
  LEVEL_SIZE,
  MAX_HOME_SHARE,
  MIN_HOMES,
  MIN_SCRAMBLE,
  N,
  S,
  SolarGame,
  W,
  cableShape,
  generatePuzzle,
  homeCells,
  isSolved,
  neighbour,
  nextItems,
  opposite,
  orientations,
  parFor,
  poweredCells,
  rotateMask,
  scrambledShare,
  solarScore,
  solarStars,
  turnsToSolve,
  type Board,
  type Tile,
} from './logic';

const tile = (kind: Tile['kind'], shape: number, mask = shape): Tile => ({ kind, shape, mask });

/** Turns every tile back to its generated position. */
function solve(board: Board): void {
  for (const t of board.tiles) t.mask = t.shape;
}

/** Number of distinct tree edges: each is counted from both ends. */
function edgeCount(board: Board): number {
  let ends = 0;
  board.tiles.forEach((t, i) => {
    for (const d of [N, E, S, W]) {
      if (!(t.shape & d)) continue;
      const j = neighbour(board.size, i, d);
      expect(j, `tile ${i} points off the grid`).toBeGreaterThanOrEqual(0);
      expect(board.tiles[j]!.shape & opposite(d), `tile ${i} → ${j}`).toBeTruthy();
      ends++;
    }
  });
  return ends / 2;
}

describe('rotateMask', () => {
  it('turns cable ends clockwise and wraps W back to N', () => {
    expect(rotateMask(N)).toBe(E);
    expect(rotateMask(E)).toBe(S);
    expect(rotateMask(S)).toBe(W);
    expect(rotateMask(W)).toBe(N);
    expect(rotateMask(N | E)).toBe(E | S);
    expect(rotateMask(W | N)).toBe(N | E);
  });

  it('comes back to the start after four turns', () => {
    for (let m = 0; m < 16; m++) {
      expect(rotateMask(m, 4)).toBe(m);
      expect(rotateMask(rotateMask(rotateMask(rotateMask(m))))).toBe(m);
      expect(rotateMask(m, 5)).toBe(rotateMask(m));
    }
  });

  it('pairs opposite sides', () => {
    expect(opposite(N)).toBe(S);
    expect(opposite(E)).toBe(W);
    expect(opposite(S)).toBe(N);
    expect(opposite(W)).toBe(E);
  });
});

describe('shapes', () => {
  it('names the cable shapes', () => {
    expect(cableShape(N)).toBe('end');
    expect(cableShape(N | S)).toBe('straight');
    expect(cableShape(E | W)).toBe('straight');
    expect(cableShape(N | E)).toBe('corner');
    expect(cableShape(N | E | S)).toBe('tee');
    expect(cableShape(N | E | S | W)).toBe('cross');
  });

  it('counts distinct orientations', () => {
    expect(orientations(N | E | S | W)).toBe(1);
    expect(orientations(N | S)).toBe(2);
    expect(orientations(N | E)).toBe(4);
    expect(orientations(N | E | S)).toBe(4);
    expect(orientations(W)).toBe(4);
  });
});

describe('turnsToSolve and parFor', () => {
  it('counts clockwise turns', () => {
    expect(turnsToSolve(tile('cable', N | E))).toBe(0);
    // N|E turned once is E|S; three more turns bring it back.
    expect(turnsToSolve(tile('cable', N | E, E | S))).toBe(3);
    expect(turnsToSolve(tile('cable', N | E, W | N))).toBe(1);
  });

  it('knows a straight looks the same after two turns, and a cross always fits', () => {
    expect(turnsToSolve(tile('cable', N | S, E | W))).toBe(1);
    expect(turnsToSolve(tile('cable', N | S, N | S))).toBe(0);
    expect(turnsToSolve(tile('cable', 15))).toBe(0);
  });

  it('adds up every tile for par', () => {
    const board: Board = {
      size: 2,
      source: 0,
      tiles: [
        tile('source', E, S), // 3 turns
        tile('home', W, W), // 0
        tile('cable', N | S, E | W), // 1
        tile('home', N, E), // 3
      ],
    };
    expect(parFor(board)).toBe(7);
  });
});

describe('poweredCells', () => {
  // A 3×1 row: farm → straight → home.
  const row = (middle: number, home = W): Board => ({
    size: 3,
    source: 0,
    tiles: [
      tile('source', E),
      tile('cable', E | W, middle),
      tile('home', W, home),
      ...Array.from({ length: 6 }, () => tile('cable', 0)),
    ],
  });

  it('flows through matching cable ends', () => {
    expect([...poweredCells(row(E | W))].sort()).toEqual([0, 1, 2]);
    expect(isSolved(row(E | W))).toBe(true);
  });

  it('stops where the ends do not line up', () => {
    expect([...poweredCells(row(N | S))]).toEqual([0]);
    expect(isSolved(row(N | S))).toBe(false);
    // The middle cable reaches the home, but the home faces away.
    expect([...poweredCells(row(E | W, N))].sort()).toEqual([0, 1]);
  });

  it('needs both ends: a cable pointing at a tile without a matching end stays dark', () => {
    const board: Board = {
      size: 2,
      source: 0,
      tiles: [tile('source', E), tile('cable', S), tile('home', N), tile('home', N)],
    };
    expect([...poweredCells(board)]).toEqual([0]);
  });

  it('never leaks off the edge of the grid', () => {
    const board: Board = {
      size: 2,
      source: 0,
      tiles: [tile('source', 15), tile('home', W, N), tile('home', N, W), tile('cable', 0)],
    };
    expect([...poweredCells(board)]).toEqual([0]);
  });
});

describe('generatePuzzle', () => {
  const sizes = Object.values(LEVEL_SIZE);

  it.each(sizes)('deals a %i×%i spanning tree that powers every home once solved', (size) => {
    for (let seed = 1; seed <= 40; seed++) {
      const board = generatePuzzle(size, seededRng(seed));
      expect(board.tiles).toHaveLength(size * size);
      // A spanning tree over n cells has n - 1 edges and reaches every cell.
      expect(edgeCount(board)).toBe(size * size - 1);
      solve(board);
      expect(poweredCells(board).size).toBe(size * size);
      expect(isSolved(board)).toBe(true);
    }
  });

  it.each(sizes)('puts a home on every dead end but the farm (%i)', (size) => {
    for (let seed = 1; seed <= 40; seed++) {
      const board = generatePuzzle(size, seededRng(seed));
      const homes = homeCells(board);
      expect(homes.length).toBeGreaterThanOrEqual(MIN_HOMES);
      expect(homes.length).toBeLessThanOrEqual(size * size * MAX_HOME_SHARE);
      board.tiles.forEach((t, i) => {
        if (i === board.source) expect(t.kind).toBe('source');
        else expect(t.kind === 'home').toBe(cableShape(t.shape) === 'end');
        if (t.kind === 'cable') expect(cableShape(t.shape)).not.toBe('end');
      });
    }
  });

  it.each(sizes)('puts the solar farm near the centre (%i)', (size) => {
    for (let seed = 1; seed <= 20; seed++) {
      const board = generatePuzzle(size, seededRng(seed));
      const row = Math.floor(board.source / size);
      const col = board.source % size;
      const centre = (size - 1) / 2;
      expect(Math.abs(row - centre)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(col - centre)).toBeLessThanOrEqual(0.5);
    }
  });

  it.each(sizes)('starts well scrambled and unsolved (%i)', (size) => {
    for (let seed = 1; seed <= 40; seed++) {
      const board = generatePuzzle(size, seededRng(seed));
      expect(scrambledShare(board)).toBeGreaterThanOrEqual(MIN_SCRAMBLE);
      expect(isSolved(board)).toBe(false);
      expect(parFor(board)).toBeGreaterThan(0);
    }
  });

  it('is deterministic for a seed', () => {
    const a = generatePuzzle(5, seededRng(42));
    const b = generatePuzzle(5, seededRng(42));
    expect(b).toEqual(a);
    expect(generatePuzzle(5, seededRng(43))).not.toEqual(a);
  });
});

describe('SolarGame', () => {
  it('solves in exactly par turns by following turnsToSolve', () => {
    const game = new SolarGame(generatePuzzle(4, seededRng(7)));
    const powered: number[] = [];
    let last = null;
    game.board.tiles.forEach((t, i) => {
      for (let k = turnsToSolve(t); k > 0; k--) {
        last = game.turn(i);
        if (last.kind === 'turned') powered.push(...last.newlyPowered);
      }
    });
    expect(game.turns).toBe(game.par);
    expect(last).toMatchObject({ kind: 'turned', solved: true });
    expect(game.poweredHomes).toBe(game.totalHomes);
    expect(new Set(powered).size).toBe(game.totalHomes);
    expect(solarStars(game.par, game.turns)).toBe(3);
  });

  it('ignores turns after the puzzle is solved and off-board taps', () => {
    const board = generatePuzzle(4, seededRng(8));
    const game = new SolarGame(board);
    expect(game.turn(-1).kind).toBe('ignored');
    expect(game.turn(99).kind).toBe('ignored');
    solve(board);
    const [first] = board.tiles
      .map((t, i) => (orientations(t.shape) > 1 ? i : -1))
      .filter((i) => i >= 0);
    // Turn a tile away and back to finish via the game.
    board.tiles[first!]!.mask = rotateMask(board.tiles[first!]!.shape, 3);
    expect(game.turn(first!)).toMatchObject({ kind: 'turned', solved: true });
    expect(game.turn(first!).kind).toBe('ignored');
    expect(game.turns).toBe(1);
  });

  it('counts every turn, even ones that undo progress', () => {
    const game = new SolarGame(generatePuzzle(5, seededRng(9)));
    const i = game.board.tiles.findIndex((t) => orientations(t.shape) === 4);
    const before = game.board.tiles[i]!.mask;
    for (let k = 0; k < 4; k++) game.turn(i);
    expect(game.board.tiles[i]!.mask).toBe(before);
    expect(game.turns).toBe(4);
  });
});

describe('solarStars', () => {
  it('gives 3 stars at or under par', () => {
    expect(solarStars(14, 14)).toBe(3);
    expect(solarStars(14, 10)).toBe(3);
  });

  it('gives 2 stars up to half as many turns again', () => {
    expect(solarStars(14, 15)).toBe(2);
    expect(solarStars(14, 21)).toBe(2);
    expect(solarStars(15, 23)).toBe(2);
  });

  it('gives 1 star for finishing at all', () => {
    expect(solarStars(14, 22)).toBe(1);
    expect(solarStars(14, 200)).toBe(1);
  });
});

describe('solarScore', () => {
  it('rewards bigger grids', () => {
    expect(solarScore(6, 40, 40, 300)).toBeGreaterThan(solarScore(5, 30, 30, 300));
    expect(solarScore(5, 30, 30, 300)).toBeGreaterThan(solarScore(4, 20, 20, 300));
  });

  it('drops with turns over par, but never below zero', () => {
    expect(solarScore(5, 30, 45, 60)).toBeLessThan(solarScore(5, 30, 30, 60));
    expect(solarScore(5, 30, 10_000, 10_000)).toBeGreaterThanOrEqual(0);
  });

  it('does not reward solving under par with extra points', () => {
    expect(solarScore(5, 30, 20, 60)).toBe(solarScore(5, 30, 30, 60));
  });

  it('adds a speed bonus', () => {
    expect(solarScore(4, 20, 20, 10)).toBeGreaterThan(solarScore(4, 20, 20, 100));
    expect(solarScore(4, 20, 20, 64)).toBe(solarScore(4, 20, 20, 500));
    expect(solarScore(4, 20, 20, 500)).toBe(16 * 25);
  });
});

describe('nextItems', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('takes the next few items and wraps around', () => {
    expect(nextItems(items, 0, 3)).toEqual({ picked: ['a', 'b', 'c'], next: 3 });
    expect(nextItems(items, 3, 3)).toEqual({ picked: ['d', 'e', 'a'], next: 1 });
  });

  it('copes with bad starts, big counts and empty lists', () => {
    expect(nextItems(items, 12, 1)).toEqual({ picked: ['c'], next: 3 });
    expect(nextItems(items, -1, 1)).toEqual({ picked: ['e'], next: 0 });
    expect(nextItems(items, 0, 9).picked).toHaveLength(5);
    expect(nextItems([], 3, 2)).toEqual({ picked: [], next: 0 });
  });
});
