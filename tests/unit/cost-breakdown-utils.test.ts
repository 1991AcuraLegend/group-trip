import { describe, it, expect } from 'vitest';
import { buildCostGrid, getUserShare } from '@/lib/cost-breakdown-utils';
import type { CostRow } from '@/lib/cost-breakdown-utils';
import type { MemberWithUser } from '@/hooks/useMembers';
import {
  makeFlight,
  makeLodging,
  makeCarRental,
  makeRestaurant,
  makeActivity,
  makeEntriesData,
} from '../fixtures';
import { MemberRole } from '@prisma/client';

const NOW = new Date('2026-01-15T12:00:00.000Z');

function makeMember(overrides: Partial<MemberWithUser> & { user?: Partial<MemberWithUser['user']> } = {}): MemberWithUser {
  const { user: userOverrides, ...rest } = overrides;
  return {
    id: 'member-1',
    userId: 'user-1',
    tripId: 'trip-1',
    role: MemberRole.OWNER,
    joinedAt: NOW.toISOString(),
    user: { id: 'user-1', name: 'Alice', email: 'alice@test.com', ...userOverrides },
    ...rest,
  };
}

const alice = makeMember();
const bob = makeMember({
  id: 'member-2',
  userId: 'user-2',
  role: MemberRole.COLLABORATOR,
  user: { id: 'user-2', name: 'Bob', email: 'bob@test.com' },
});
const carol = makeMember({
  id: 'member-3',
  userId: 'user-3',
  role: MemberRole.COLLABORATOR,
  user: { id: 'user-3', name: 'Carol', email: 'carol@test.com' },
});

// ---------------------------------------------------------------------------
// buildCostGrid
// ---------------------------------------------------------------------------

describe('buildCostGrid', () => {
  it('returns empty rows when entries have no costs', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ cost: null })],
      lodgings: [],
      carRentals: [],
      restaurants: [],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice, bob]);
    expect(grid.rows).toHaveLength(0);
    expect(grid.totals['user-1']).toBe(0);
    expect(grid.totals['user-2']).toBe(0);
  });

  it('excludes entries with cost of 0', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ cost: 0 })],
      lodgings: [],
      carRentals: [],
      restaurants: [],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice]);
    expect(grid.rows).toHaveLength(0);
  });

  it('excludes idea entries', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ isIdea: true, cost: 350 })],
      lodgings: [],
      carRentals: [],
      restaurants: [],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice]);
    expect(grid.rows).toHaveLength(0);
  });

  it('splits cost equally among all members when attendeeIds is empty', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ cost: 300, attendeeIds: [] })],
      lodgings: [],
      carRentals: [],
      restaurants: [],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice, bob, carol]);
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0].attendeeIds).toEqual(['user-1', 'user-2', 'user-3']);
    expect(grid.totals['user-1']).toBe(100);
    expect(grid.totals['user-2']).toBe(100);
    expect(grid.totals['user-3']).toBe(100);
  });

  it('splits cost only among specified attendees', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ cost: 200, attendeeIds: ['user-1', 'user-3'] })],
      lodgings: [],
      carRentals: [],
      restaurants: [],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice, bob, carol]);
    expect(grid.totals['user-1']).toBe(100);
    expect(grid.totals['user-2']).toBe(0);
    expect(grid.totals['user-3']).toBe(100);
  });

  it('computes totals correctly across multiple entries with mixed attendees', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ cost: 300, attendeeIds: ['user-1', 'user-2'] })],
      lodgings: [makeLodging({ cost: 400, attendeeIds: [] })], // all 3 split
      carRentals: [],
      restaurants: [makeRestaurant({ cost: 90, attendeeIds: ['user-2'] })],
      activities: [],
    });
    const grid = buildCostGrid(entries, [alice, bob, carol]);
    // Flight: 300/2 = 150 each for alice, bob
    // Lodging: 400/3 ≈ 133.33 each for alice, bob, carol
    // Restaurant: 90/1 = 90 for bob
    const expectedAlice = 150 + 400 / 3;
    const expectedBob = 150 + 400 / 3 + 90;
    const expectedCarol = 400 / 3;
    expect(grid.totals['user-1']).toBeCloseTo(expectedAlice, 5);
    expect(grid.totals['user-2']).toBeCloseTo(expectedBob, 5);
    expect(grid.totals['user-3']).toBeCloseTo(expectedCarol, 5);
  });

  it('sorts rows by date ascending with nulls last', () => {
    const entries = makeEntriesData({
      flights: [makeFlight({ id: 'f1', cost: 100, departureDate: new Date('2026-03-05T00:00:00Z') })],
      lodgings: [makeLodging({ id: 'l1', cost: 200, checkIn: new Date('2026-03-01T00:00:00Z') })],
      carRentals: [],
      restaurants: [makeRestaurant({ id: 'r1', cost: 50, date: null })],
      activities: [makeActivity({ id: 'a1', cost: 75, date: new Date('2026-03-03T00:00:00Z') })],
    });
    const grid = buildCostGrid(entries, [alice]);
    expect(grid.rows.map(r => r.id)).toEqual(['l1', 'a1', 'f1', 'r1']);
  });

  it('orders members with owner first, then alphabetical', () => {
    const grid = buildCostGrid(
      makeEntriesData({ flights: [], lodgings: [], carRentals: [], restaurants: [], activities: [] }),
      [carol, alice, bob],
    );
    // alice is OWNER, bob and carol are COLLABORATOR → alice, bob, carol
    expect(grid.memberIds).toEqual(['user-1', 'user-2', 'user-3']);
  });

  it('builds memberNames mapping', () => {
    const grid = buildCostGrid(
      makeEntriesData({ flights: [], lodgings: [], carRentals: [], restaurants: [], activities: [] }),
      [alice, bob],
    );
    expect(grid.memberNames).toEqual({
      'user-1': 'Alice',
      'user-2': 'Bob',
    });
  });

  it('includes all 5 entry types', () => {
    const entries = makeEntriesData(); // defaults with one of each
    const grid = buildCostGrid(entries, [alice]);
    expect(grid.rows.length).toBe(5);
    const types = grid.rows.map(r => r.type).sort();
    expect(types).toEqual(['activity', 'carRental', 'flight', 'lodging', 'restaurant']);
  });
});

// ---------------------------------------------------------------------------
// getUserShare
// ---------------------------------------------------------------------------

describe('getUserShare', () => {
  const row: CostRow = {
    id: 'test-1',
    type: 'flight',
    name: 'Delta DL123',
    totalCost: 300,
    date: new Date(),
    attendeeIds: ['user-1', 'user-2'],
    entry: makeFlight(),
  };

  it('returns share for an attendee', () => {
    expect(getUserShare(row, 'user-1')).toBe(150);
    expect(getUserShare(row, 'user-2')).toBe(150);
  });

  it('returns null for a non-attendee', () => {
    expect(getUserShare(row, 'user-3')).toBeNull();
  });
});
