# Items

## Where things live

| File | Holds |
| --- | --- |
| `src/content/items/wardrobe.ts` | Hats, robes, wands, pets and pet outfits. |
| `src/content/items/room.ts` | Furniture, little decor, wall hangings, rugs. |
| `src/content/items/index.ts` | Joins the catalogs; `item(id)` lookup. |
| `src/content/world/room.ts` | Starting clutter and where fixed furniture goes. |

## Item format

```ts
{
  id: 'hat-frog',          // "<category>-<name>"; stored in saves, never rename once shipped
  name: 'Frog Hat',        // short, shown under the picture
  category: 'hat',         // hat | robe | wand | pet | furniture | decor | wall | rug
  sprite: 'hats/frog',     // under public/sprites, no ".png" (robes have none)
  price: 40,               // 0 = gift only, never sold
  unlock: 'fix-window',    // lesson that puts it in the shop
  requires: 'pet-kitten',  // optional: must own this first
  hatOffset: 6,            // hats only: push down onto the head
  robe: { main: '#5e9c55', trim: '#e8c86a', pattern: 'stars' }, // robes only
}
```

Most catalogs use small helpers (`hat()`, `robe()`, `item()`) that fill in the id and sprite from a name.

## Rules (enforced by `content.test.ts`)

- Ids are unique.
- Every sprite file exists.
- `unlock` and `requires` point at real lessons and items.
- Every price-0 item is a starter item or a lesson gift, so nothing is unobtainable.
- Gifts are never also sold.

## Pricing guide

| Category | Price range |
| --- | --- |
| Little decor | 15 to 35 |
| Wall hangings, rugs | 20 to 50 |
| Hats | 20 to 70 |
| Robes | 15 to 70 |
| Wands and staffs | 20 to 65 |
| Furniture | 25 to 80 |
| Pet outfits | 30 to 40 |

Price grows with the unlock lesson, so later items feel special. A lesson's first-time stars pay 50 gold in total.

## Robes

Robes have no sprite. The wizard base sprite is recolored with `main`, and `trim` is used for the hem and the pattern (`stars`, `moons`, `dots`, `stripes`, `hearts`, `leaves`). New patterns go in `patternAt()` in `src/render/wizard.ts`, plus the `RobeStyle` type.

## Room categories

| Category | Placed | Drawn |
| --- | --- | --- |
| `rug` | Floor | Under everything |
| `wall` | Wall | Behind furniture |
| `furniture` | Floor | Sorted by how low it stands |
| `decor` | Anywhere | On top of furniture, so it can sit on tables |
