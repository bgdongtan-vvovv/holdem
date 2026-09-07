export type TableOrientation = "portrait" | "landscape";
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };

export type TableLayout = {
  orientation: TableOrientation;
  scale: number;
  seats: Point[];
  hero: Point;
  board: Rect;
  pot: Point;
  actionBar: Rect;
};

const LANDSCAPE_SEATS: Point[] = [
  { x: 0.5, y: 0.82 },
  { x: 0.22, y: 0.78 },
  { x: 0.08, y: 0.5 },
  { x: 0.2, y: 0.18 },
  { x: 0.38, y: 0.12 },
  { x: 0.62, y: 0.12 },
  { x: 0.8, y: 0.18 },
  { x: 0.92, y: 0.5 },
  { x: 0.78, y: 0.78 },
];

const PORTRAIT_SEATS: Point[] = [
  { x: 0.5, y: 0.82 },
  { x: 0.16, y: 0.74 },
  { x: 0.12, y: 0.56 },
  { x: 0.12, y: 0.38 },
  { x: 0.2, y: 0.18 },
  { x: 0.8, y: 0.18 },
  { x: 0.88, y: 0.38 },
  { x: 0.88, y: 0.56 },
  { x: 0.84, y: 0.74 },
];

const SEAT_SAMPLING: Record<number, number[]> = {
  2: [0, 4],
  3: [0, 3, 6],
  4: [0, 2, 4, 7],
  5: [0, 2, 4, 5, 7],
  6: [0, 1, 3, 4, 5, 7],
  7: [0, 1, 2, 4, 5, 7, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

function sampleSeatRing(ring: Point[], seatCount: number): Point[] {
  const indices = SEAT_SAMPLING[seatCount];
  if (!indices) {
    throw new RangeError("seatCount must be between 2 and 9");
  }
  return indices.map((idx) => ring[idx]);
}

export function createTableLayout(input: {
  width: number;
  height: number;
  seatCount: number;
  orientation: TableOrientation;
}): TableLayout {
  if (!Number.isInteger(input.seatCount) || input.seatCount < 2 || input.seatCount > 9) {
    throw new RangeError("seatCount must be between 2 and 9");
  }

  const source = input.orientation === "landscape" ? LANDSCAPE_SEATS : PORTRAIT_SEATS;
  const seats = sampleSeatRing(source, input.seatCount);

  return {
    orientation: input.orientation,
    scale: Math.min(input.width / 844, input.height / 390),
    seats,
    hero: seats[0]!,
    board:
      input.orientation === "landscape"
        ? { x: 0.34, y: 0.43, width: 0.32, height: 0.18 }
        : { x: 0.15, y: 0.42, width: 0.7, height: 0.13 },
    pot: input.orientation === "landscape" ? { x: 0.5, y: 0.36 } : { x: 0.5, y: 0.35 },
    actionBar:
      input.orientation === "landscape"
        ? { x: 0.61, y: 0.86, width: 0.38, height: 0.13 }
        : { x: 0.02, y: 0.88, width: 0.96, height: 0.1 },
  };
}
