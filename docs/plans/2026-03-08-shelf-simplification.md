# Shelf App Simplification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the app by merging duplicate features (lists into shelves, timeline into journal), switching ratings to 0-5, and redesigning the share card for Instagram virality.

**Architecture:** Four independent workstreams that can be parallelized. Rating change is the simplest (constants + display). Lists/shelves merge consolidates two identical DB tables and UI flows into one. Journal/timeline merge adds a grid view toggle to journal and removes timeline. Share card is a frontend-design redesign.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM, Neon Postgres, Tailwind CSS, html-to-image

---

## Task 1: Rating Scale 0-5

**Files:**
- Modify: `src/lib/constants.ts` (RATINGS array, RATING_MAP)
- Modify: `src/components/LogBookForm.tsx:204-226` (star selector renders 10 buttons, needs 5)
- Modify: `src/components/ShareCardModal.tsx:57-60` (rating display)
- Modify: `src/app/api/import/route.ts:204` (Goodreads rating conversion)
- Modify: `src/app/api/user-books/route.ts` (rating validation)
- Modify: Every file using `RATING_MAP` or `RATINGS` (38 files, but most just display `RATING_MAP[rating]` which auto-fixes)

**Step 1: Update constants.ts**

Replace RATINGS and RATING_MAP:

```ts
export const RATINGS = [
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
  { value: 0, label: '0' },
] as const

export const RATING_MAP: Record<number, string> = Object.fromEntries(
  RATINGS.map(r => [r.value, r.label])
)
```

**Step 2: Update LogBookForm.tsx star selector**

The current code renders 10 stars (half-star increments). Change to 5 stars:
- `RATINGS.slice().reverse()` will now produce [0,1,2,3,4,5] reversed = [5,4,3,2,1,0]
- Skip the 0-value button (0 means "no rating", clicking an active star deselects)
- The fill logic `(displayRating ?? 0) >= r.value` still works since values are now 0-5
- But we need to handle 0 differently: 0 is a valid rating ("0 stars"), while null means "not rated"
- Decision: exclude 0 from the star picker. Users rate 1-5 or leave unrated (null). Simpler.

Update RATINGS to be 1-5 only (remove 0):
```ts
export const RATINGS = [
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
] as const
```

Star selector stays the same structurally; it now renders 5 stars instead of 10.

**Step 3: Update import route**

Change Goodreads conversion from `grRating * 2` to just `grRating`:
```ts
const rating = grRating >= 1 && grRating <= 5 ? grRating : null
```

**Step 4: Update user-books API validation**

Anywhere rating is validated (e.g., `rating >= 1 && rating <= 10`), change to `rating >= 1 && rating <= 5`.

**Step 5: DB migration for existing data**

Run SQL to convert existing ratings:
```sql
UPDATE user_books SET rating = ROUND(rating / 2.0) WHERE rating IS NOT NULL;
UPDATE re_reads SET rating = ROUND(rating / 2.0) WHERE rating IS NOT NULL;
```

Use drizzle-kit or raw SQL via the Neon console.

**Step 6: Verify all display components**

All files using `RATING_MAP[rating]` will auto-resolve since the map keys change from 1-10 to 1-5. But the display values change from "0.5"-"5.0" to "1"-"5", so visually the labels become cleaner numbers.

Check these key display components render correctly:
- `BookEntryRow.tsx`
- `ReviewList.tsx`
- `BookDetailClient.tsx`
- `RatingDistribution.tsx`
- `ShelfDetailClient.tsx` (shelf detail page uses RATING_MAP)
- `StatsShareCard.tsx`

**Step 7: Commit**

```
feat: simplify rating scale to 1-5 stars
```

---

## Task 2: Merge Lists into Shelves

**Files to modify:**
- Modify: `src/lib/schema.ts` (add position/note to shelfItems, remove lists/listItems tables and types)
- Modify: `src/app/api/shelves/route.ts` (add community shelves to GET, increase name limit to 200)
- Modify: `src/app/api/shelves/[id]/items/route.ts` (add position support, PATCH for reorder)
- Modify: `src/app/shelves/page.tsx` (add community shelves section)
- Modify: `src/app/shelves/[id]/page.tsx` (add reorder support)
- Modify: `src/components/ShelvesClient.tsx` (add public/private toggle, community section)
- Modify: `src/components/ShelfDetailClient.tsx` (add reorder from ListDetailClient)
- Modify: `src/components/LogBookForm.tsx:318-376` (change "List" button to "Shelf", update API calls)
- Modify: `src/components/SiteNav.tsx` (remove Lists link)
- Modify: `src/components/MobileMenu.tsx` (remove Lists from NAV_LINKS)
- Modify: `src/components/KeyboardShortcuts.tsx` (remove `l: '/lists'`)
- Modify: `src/app/search/page.tsx:300` (change /lists/ links to /shelves/)

**Files to delete:**
- Delete: `src/app/api/lists/route.ts`
- Delete: `src/app/api/lists/[id]/items/route.ts`
- Delete: `src/app/lists/page.tsx`
- Delete: `src/app/lists/[id]/page.tsx`
- Delete: `src/components/ListsClient.tsx`
- Delete: `src/components/ListDetailClient.tsx`

**Step 1: Update schema.ts**

Add `position` and `note` columns to `shelfItems`:
```ts
export const shelfItems = pgTable('shelf_items', {
  id:        uuid('id').primaryKey().defaultRandom(),
  shelfId:   uuid('shelf_id').notNull().references(() => shelves.id, { onDelete: 'cascade' }),
  bookId:    uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  position:  integer('position').notNull().default(0),
  note:      text('note'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  shelfIdx:   index('shelf_items_shelf_idx').on(t.shelfId),
  uniqueItem: uniqueIndex('shelf_items_unique').on(t.shelfId, t.bookId),
}))
```

Add `updatedAt` to shelves table:
```ts
export const shelves = pgTable('shelves', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  name:        text('name').notNull(),
  description: text('description'),
  isPublic:    boolean('is_public').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
}, ...)
```

Remove `lists`, `listItems` table definitions and their type exports. Keep `Shelf` and `ShelfItem` types.

**Step 2: Push schema changes**

```bash
bunx dotenv-cli -e .env.local -- bunx drizzle-kit push
```

**Step 3: Migrate list data to shelves**

SQL migration (run before dropping lists tables):
```sql
-- Copy lists to shelves (only those not already existing by name+userId)
INSERT INTO shelves (id, user_id, name, description, is_public, created_at)
SELECT id, user_id, name, description, is_public, created_at
FROM lists
ON CONFLICT DO NOTHING;

-- Copy list items to shelf items
INSERT INTO shelf_items (id, shelf_id, book_id, position, note, created_at)
SELECT id, list_id, book_id, position, note, created_at
FROM list_items
ON CONFLICT DO NOTHING;
```

**Step 4: Update shelves API route**

Merge the lists API features into shelves:
- GET: add community shelves (public shelves from other users), same as lists page had
- POST: increase name limit from 100 to 200
- Add `isPublic` parameter to POST

**Step 5: Update shelves items API route**

Port from lists items route:
- Add PATCH handler for reorder (position updates)
- Add position auto-increment on POST (get max position, add 1)

**Step 6: Update ShelvesClient.tsx**

Merge features from ListsClient:
- Add public/private toggle on create form
- Add community shelves section (public shelves from other users)
- Accept `publicShelves` prop

**Step 7: Update shelves page.tsx**

Add community shelves query (port from lists page):
- Query public shelves from other users
- Pass to ShelvesClient as `publicShelves`

**Step 8: Update ShelfDetailClient.tsx**

Port reorder functionality from ListDetailClient:
- Add reorder mode with drag-and-drop
- Add arrow up/down buttons
- Add position saving via PATCH

**Step 9: Update shelf detail page**

Add rating display support (already exists, just verify).

**Step 10: Update LogBookForm.tsx**

Change the "List" dropdown to "Shelf":
- Change fetch from `/api/lists` to `/api/shelves`
- Change fetch from `/api/lists/${list.id}/items` to `/api/shelves/${shelf.id}/items`
- Change text from "List" to "Shelf", "No lists yet" to "No shelves yet"
- Change link from `/lists` to `/shelves`

**Step 11: Update navigation**

SiteNav.tsx: Remove `<li><a href="/lists">Lists</a></li>`
MobileMenu.tsx: Remove `{ href: '/lists', label: 'Lists' }` from NAV_LINKS
KeyboardShortcuts.tsx: Remove `l: '/lists'`

**Step 12: Update search page**

Change any `/lists/${list.id}` links to `/shelves/${shelf.id}`

**Step 13: Delete list files**

Delete all list-specific files:
- `src/app/api/lists/route.ts`
- `src/app/api/lists/[id]/items/route.ts`
- `src/app/lists/page.tsx`
- `src/app/lists/[id]/page.tsx`
- `src/components/ListsClient.tsx`
- `src/components/ListDetailClient.tsx`

**Step 14: Drop lists tables from DB**

After verifying everything works:
```sql
DROP TABLE IF EXISTS list_items;
DROP TABLE IF EXISTS lists;
```

**Step 15: Commit**

```
feat: merge lists into shelves, single collection concept
```

---

## Task 3: Merge Timeline into Journal

**Files to modify:**
- Modify: `src/app/journal/page.tsx` (add grid view toggle, port timeline's visual grid)
- Modify: `src/components/SiteNav.tsx` (remove Timeline link)
- Modify: `src/components/MobileMenu.tsx` (remove Timeline from NAV_LINKS)
- Modify: `src/components/KeyboardShortcuts.tsx` (remove timeline shortcut if exists)

**Files to delete:**
- Delete: `src/app/timeline/page.tsx`

**Step 1: Add view toggle to journal page**

Add a `view` query param (`list` or `grid`, default `list`).

Add a view toggle UI (two small icon buttons: list icon, grid icon) next to the existing filter pills.

**Step 2: Port timeline's grid view**

When `view=grid`, render the timeline-style grid layout:
- Books displayed as cover thumbnails in a responsive grid
- `gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))'`
- Each book shows: cover image, title (truncated), rating in copper
- Grouped by month (same as timeline)
- Link to book detail page

The list view stays as-is (BookEntryRow + DiaryCalendar).

**Step 3: Update grid view to work with journal's filters**

Timeline only showed "read" books. Journal's grid view should respect the current status filter (or show all statuses if no filter). The journal already has all the filter logic; we just need to render differently based on view param.

**Step 4: Update navigation**

SiteNav.tsx: Remove `<li><a href="/timeline">Timeline</a></li>`
MobileMenu.tsx: Remove `{ href: '/timeline', label: 'Timeline' }` from NAV_LINKS

**Step 5: Delete timeline page**

Delete `src/app/timeline/page.tsx`

**Step 6: Update any links to /timeline**

Search for references and redirect to /journal.

**Step 7: Commit**

```
feat: merge timeline into journal with grid/list view toggle
```

---

## Task 4: Redesign Share Card (Instagram-Ready)

**Files to modify:**
- Modify: `src/components/ShareCardModal.tsx` (complete redesign)
- Modify: `src/lib/share-image.ts` (may need higher pixel ratio)

**Step 1: Use frontend-design skill**

Invoke `frontend-design` skill to redesign the ShareCardModal with these requirements:
- Instagram story ratio (1080x1920 / 9:16) as primary format
- Square (1:1) as secondary option
- Large, prominent book cover image
- Best excerpt from the review (auto-selected or user-highlighted)
- Star rating displayed prominently
- Clean, editorial typography using Cormorant Garamond (heading font already in project)
- Dark theme matching the app aesthetic (--bg, --copper, --surface colors)
- Shelf.app branding (subtle, bottom corner)
- The card should look like something you'd see on a book influencer's Instagram story

**Step 2: Implement the redesigned component**

Replace ShareCardModal.tsx with the new design.

**Step 3: Test image generation**

Verify html-to-image generates clean PNGs at 2x resolution.
Test both copy and download flows.

**Step 4: Commit**

```
feat: redesign share card for Instagram stories
```

---

## Execution Order

Tasks 1, 2, and 3 are independent and can be parallelized.
Task 4 (share card) depends on Task 1 (rating scale) since it displays ratings.

Recommended: Run Tasks 1, 2, 3 in parallel, then Task 4.

---

## Nav After All Changes

Before (12 links):
Discover, Books, **Lists**, **Shelves**, Library, Journal, **Timeline**, Reviews, Quotes, Tags, Import, Members

After (10 links):
Discover, Books, Shelves, Library, Journal, Reviews, Quotes, Tags, Import, Members
