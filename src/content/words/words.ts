/**
 * Master word list. Every word here must be safe and familiar for 7-9 year olds.
 *
 * Lessons never list "allowed words" by hand: the generator picks words from
 * this list that only use keys the player has learned so far. To add words,
 * add them anywhere below (lowercase, letters only). Duplicates are removed.
 */
const RAW = `
a ad add adds all as ask asks dad dads fad fads fall falls flask flasks lad lads sad salad salads alas alfalfa
gas glad glass hall halls half has had hash dash flag flags flash slash shall sash gala aha ha
like lake kids kid hide side slide glide file fig figs dig digs dish fish sea see seed seeds feed fee heel feel
deal idea ideas aid said sail sails fail hail kale safe egg eggs head lead leaf leg legs desk sled shelf self
she he hi if is his hid lid lids field life fade jade age sage glee geese fiddle giggle jiggle hike hikes
rug rugs fur red ride rid sure rule rules sugar fire hair dear rail real rise jar jars rag far fair dark shark
use huge hug hugs drag hard herd frisk surf fudge judge glue ruler duke lure fries fire fires hire share
tree trees try yet stay fruit tea eat art hat hats tall tail tale yard yes day days say ray tray star stars start
kitty silly jelly jet kite kites treat the they that this these there tiger guest gift gate great fast last test
rest easy early ready hey key keys dusty rusty sky dry fry shy tidy daisy steady sticky tasty tiny turtle tea
owl owls wood slow low glow flow word words two who how wow we wet west water wait will wish with wolf worm
work world year would yellow frog dog dogs log logs fog hot rose horse house out our shout food good look
book books foot root tooth door floor hook row toast goat road roar gold old told hold sold fold story sorry
forest ghost robot soft sofa tooth wood woof dot dots got lot rod sort short shore four your door
pop pup puppy soup pie paper apple apples happy pet pets pig pigs pea peas pear park play plate pool pot put
quiet quit quilt quest squid quail squeak spot spell spells spider super sleep sheep ship shop stop step top
tap trap trip hop hope rope pile pipe pillow purple potato pirate puddle pepper spoon spoons drip drop
move mud me my map mom milk more most vase very five give live love wave save gave have dive drive over
river silver home game time smile small swim warm worm team dream farm storm mirror lamp lime jam ham hum mug
room some same moose mouse mice meow moat mole mop marsh muffin
bat bag ball bed bee big bird boat bug bus bun but bell best bike blue bubble bunny butter banana
rabbit robin bean barn bread brown brave broom nap net new nest nine nose not nut now no and ant ten then when
one sun run fun fan man pan hand sand land wind kind mind find friend garden green rainbow window dragon wagon
moon noon snow snail snake sing song king ring wing swing spring morning evening open seven
lemon lion penguin pony tent tiny unicorn win banjo nanny bubble
cat can cake car cup cub cow cold coat cookie castle candy carrot circle clock cloud cook corn crab crown cave
ice nice rice dance face race space place juice magic music pencil picnic rocket pocket chick chicken chair
cheese cherry catch back black duck sock rock kick stick trick truck acorn bacon cocoa cozy
box fox six wax mix fix ox taxi next extra relax
zoo zip zebra buzz fizz fuzzy lazy maze prize size freeze breeze pizza puzzle zigzag zero dizzy wizard blizzard
`;

export const WORDS: readonly string[] = [...new Set(RAW.split(/\s+/).filter(Boolean))];

/** Names for capital-letter practice, split by which hand types the first letter. */
export const NAMES_RIGHT_HAND: readonly string[] = [
  'Jo', 'Kim', 'Lily', 'Leo', 'Max', 'Mia', 'Noah', 'Nora', 'Ollie', 'Owen', 'Penny', 'Pip',
  'Hugo', 'Iris', 'Uma', 'Yuki', 'Kai', 'Luna', 'Milo', 'Nina', 'Hana', 'Jack', 'Lou', 'Ivy',
];
export const NAMES_LEFT_HAND: readonly string[] = [
  'Sam', 'Dan', 'Ava', 'Ted', 'Rex', 'Bea', 'Gus', 'Zed', 'Ella', 'Finn', 'Gwen', 'Rosa', 'Tess',
  'Wes', 'Vic', 'Cora', 'Ada', 'Eli', 'Fay', 'Ruby', 'Wren', 'Sage', 'Quinn', 'Bo',
];
