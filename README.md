# Jump Quest Adventures

# MASTER GAME-BUILD PROMPT

## Project: Original High-Quality 2D Platformer With Mushroom-Kingdom-Inspired Gameplay

You are a senior game-engineering team consisting of:

* Gameplay programmer

* Game physics programmer

* 2D/3D graphics programmer

* UI/UX designer

* Level designer

* Character designer

* Sound-system engineer

* Game-state/save-system engineer

* QA/test engineer

* Performance engineer

Build a complete, polished 2D side-scrolling platformer.

The game should capture the **feel of classic precision platformers**: running, jumping, enemies, collectibles, destructible blocks, question blocks, power-ups, secrets, scrolling levels, time pressure, checkpoints, and a goal flag.

IMPORTANT:

Do not copy Nintendo/Mario copyrighted sprites, music, sound effects, level assets, logos, textures, exact character designs, or proprietary source code.

Create an ORIGINAL game world, ORIGINAL characters, ORIGINAL graphics, ORIGINAL music/SFX, and ORIGINAL names.

The gameplay can use familiar platforming concepts while the visual identity, characters, world, assets, animations, level geometry, story, sound and UI should be original.

---

# 1. CORE GAME CONCEPT

Create a colorful 2D side-scrolling platform adventure.

The player controls the main hero.

The hero must travel from the beginning of the stage to the final goal.

A level contains:

* Ground

* Platforms

* Gaps

* Moving platforms

* Question blocks

* Breakable blocks

* Hidden blocks

* Coins

* Collectibles

* Enemies

* Power-ups

* Pipes/tunnels

* Secret areas

* Checkpoints

* Bonus rooms

* High platforms

* Vertical sections

* Obstacles

* Goal flag

* End-of-level sequence

The primary objective:

REACH THE GOAL FLAG.

Secondary objectives:

* Collect coins

* Discover secrets

* Defeat enemies

* Find power-ups

* Break blocks

* Find bonus areas

* Maintain a high combo

* Finish quickly

* Maximize score

---

# 2. GAME LOOP

Main loop:

START GAME

↓

CHARACTER SELECT

↓

WORLD MAP

↓

LEVEL SELECT

↓

LEVEL INTRO

↓

PLAYER CONTROLS CHARACTER

↓

RUN / JUMP / ATTACK

↓

COLLECT ITEMS

↓

DEFEAT ENEMIES

↓

DISCOVER SECRETS

↓

CHECKPOINT

↓

CONTINUE LEVEL

↓

GOAL FLAG

↓

LEVEL COMPLETE

↓

CALCULATE SCORE

↓

SAVE PROGRESS

↓

UNLOCK NEXT LEVEL

Eventually support multiple worlds and multiple playable characters.

---

# 3. LEVEL 1 — COMPLETE IMPLEMENTATION

Build Level 1 first.

Level 1 should be approximately:

* 3–5 minutes for a beginner

* 1.5–2 minutes for an experienced player

* Longer if exploring secrets

Difficulty:

INTRODUCTORY → EASY → MODERATE

The player should learn almost every basic mechanic naturally through the level.

Do NOT put every mechanic in the opening 30 seconds.

Teach mechanics progressively.

---

# 4. LEVEL 1 STRUCTURE

Divide Level 1 into sections.

## SECTION A — SAFE INTRO

Introduce:

* Running

* Jumping

* Small enemies

* Coins

* Basic blocks

The player should understand:

MOVE LEFT

MOVE RIGHT

JUMP

INTERACT

No difficult hazards initially.

---

## SECTION B — FIRST ENEMY

Introduce the first basic walking enemy.

The player can:

* Jump over it

* Stomp it

* Attack it

* Avoid it

Show visually that jumping on an enemy defeats it.

Add a small reward:

+100 SCORE

Use a satisfying bounce animation.

---

# 5. BASIC CHARACTER CONTROLS

Keyboard:

A / LEFT ARROW

= Move left

D / RIGHT ARROW

= Move right

SPACE

= Jump

SPACE + SPACE

= Double jump where supported

CTRL

= Special ability

X

= Attack / projectile depending on character

SHIFT

= Run

ESC

= Pause

E

= Interaction

R

= Restart from checkpoint

F

= Optional ability/action

Gamepad:

Left Stick

= Movement

A

= Jump

X

= Attack

B

= Dash / secondary ability

Y

= Special ability

RT

= Run

START

= Pause

---

# 6. MOVEMENT SYSTEM

Movement must feel extremely responsive.

Implement:

* Acceleration

* Deceleration

* Maximum run speed

* Walking speed

* Running speed

* Air control

* Jump buffering

* Coyote time

* Variable jump height

* Ground detection

* Slope detection

* Edge detection

* Knockback

* Sliding

* Momentum

Important:

Implement approximately 100–150 ms of jump buffering.

Implement approximately 100–150 ms coyote time.

This makes the controls forgiving without becoming floaty.

---

# 7. JUMP SYSTEM

Normal jump:

SPACE

Hold SPACE:

Higher jump.

Tap SPACE:

Short jump.

Double-tap SPACE:

Double jump where character permits.

The system must prevent accidental infinite jumping.

State machine:

GROUND

↓

JUMP_START

↓

RISING

↓

APEX

↓

FALLING

↓

LAND

For double-jump characters:

GROUND

↓

JUMP

↓

AIRBORNE

↓

SECOND_JUMP

↓

AIRBORNE

↓

FALL

↓

LAND

---

# 8. CHARACTER STATES

Every playable character must have states.

Example:

IDLE

WALK

RUN

JUMP

FALL

LAND

ATTACK

HURT

INVINCIBLE

DEAD

POWERED_UP

CROUCH

SLIDE

CLIMB

SWIM

DASH

SPECIAL

Use a finite state machine.

Do NOT write all behavior in one giant player class.

Separate:

PlayerController

MovementController

CombatController

PowerUpController

AnimationController

HealthController

AbilityController

---

# 9. HERO DESIGN

Create an ORIGINAL mascot character.

Example temporary name:

"Riko"

Riko is:

* Cheerful

* Adventurous

* Fast

* Expressive

* Friendly

* Courageous

Visual design:

* Large readable head

* Expressive eyes

* Bright clothing

* Distinct silhouette

* Gloves

* Boots

* Backpack/scarf/accessory

Do not directly copy Mario's clothing, proportions, colors, facial features, or animations.

The character must be recognizable as its own original mascot.

---

# 10. CHARACTER SIZE SYSTEM

Small form:

1x height

Powered form:

1.5–2x height

Heavy form:

2x+

The camera and collision system must support dynamic character size.

When character grows:

* Update collider

* Update sprite

* Update camera target

* Update hitbox

* Update attack reach

Avoid clipping through ceilings during transformation.

---

# 11. HEALTH / DAMAGE

Default:

3 health points OR one-hit small-form damage depending on character.

Recommended system:

Small Form:

One hit → death

Powered Form:

One hit → revert to normal form

Second hit → death

Shield Form:

Absorbs one hit

Star/Invincible:

Temporary immunity

Damage states:

NORMAL

↓

HURT

↓

INVULNERABLE

↓

NORMAL

Use a short invulnerability period after taking damage.

---

# 12. LIVES

Player starts with:

3 lives.

Lives decrease when:

* Falling into pit

* Running out of time

* Taking lethal damage

Upon death:

Death animation

↓

Freeze world

↓

Show score

↓

Respawn / Retry

Do NOT immediately restart without feedback.

---

# 13. CHECKPOINT SYSTEM

Place checkpoints throughout longer levels.

Checkpoint saves:

* Position

* Character

* Current power-up

* Coins

* Score

* Time behavior

* Progress state

After death:

Respawn at latest checkpoint.

Optional hard mode:

Restart entire level.

---

# 14. POWER-UP SYSTEM

Create original equivalents of classic platforming transformations.

## POWER-UP 1 — GROWTH ORB

Transforms:

Normal Hero → Super Hero

Abilities:

* Increased size

* Increased health state

* Can destroy weak blocks

* Stronger landing attack

---

## POWER-UP 2 — FIRE CRYSTAL

Transforms player into ranged attacker.

Ability:

Shoot bouncing fire projectiles.

Controls:

X = Fire

Projectile:

* Travels horizontally

* Bounces once or multiple times

* Disappears after lifetime

* Can hit appropriate enemies

* Produces hit effect

Limit projectile spam to prevent performance problems.

Suggested maximum active projectiles:

3–5.

---

## POWER-UP 3 — STAR CORE

Temporary invincibility.

Duration:

Approximately 8–12 seconds.

Effects:

* Flashing character

* Particle trail

* Music change

* Enemy contact damage

* Strong screen feedback

* Temporary speed increase

Enemies touched by player are defeated.

The player should NOT become immune forever.

---

## POWER-UP 4 — DASH RELIC

Ability:

Quick forward dash.

Cooldown:

1–2 seconds.

Can:

* Cross short gaps

* Break weak blocks

* Escape enemies

---

## POWER-UP 5 — WIND CAPE

Allows:

* Horizontal air movement

* Slow falling

* Air dash

* Longer jumps

---

# 15. QUESTION BLOCKS

Create blocks containing:

?

When hit from underneath:

Block reacts.

Possible contents:

* Coin

* Multiple coins

* Growth Orb

* Fire Crystal

* Star Core

* Shield

* Extra Life

* Temporary speed

* Secret item

Question block states:

ACTIVE

HIT

EMPTY

Once used:

Question block becomes inactive.

Add:

* Bounce animation

* Particle effect

* Sound effect

* Item spawn animation

---

# 16. BREAKABLE BLOCKS

Normal player:

Cannot destroy hard blocks.

Super player:

Can break them.

Fire player:

Can optionally melt special blocks.

Dash player:

Can destroy dash blocks.

Create different materials:

* Brick

* Stone

* Glass

* Magical

* Metal

* Hidden

Each should have different behavior.

---

# 17. HIDDEN BLOCKS

Some blocks are invisible until activated.

Possible behavior:

Player hits invisible location.

Block appears.

Reward:

Coin

Power-up

Platform

Secret entrance

Don't place secrets randomly.

Use level design to create curiosity.

---

# 18. COINS

Coins are major collectibles.

Properties:

value = 1

Every 10 / 50 / 100 coins:

Reward configurable.

Animations:

* Rotate

* Float

* Sparkle

* Collection flash

Collection:

Coin

→

+1 currency

→

+score

→

sound

→

particle effect

Coins can also be used for future shops/unlocks.

---

# 19. SECRET COINS

Add larger collectible coins.

Example:

"Golden Relics"

Each level:

3–5 hidden collectibles.

Rewards:

* Character skins

* Concept art

* Cosmetic items

* Bonus stages

---

# 20. ENEMY SYSTEM

Create an extensible enemy framework.

Base class:

Enemy

Components:

* Movement

* Health

* Damage

* AI

* Collision

* Animation

* Loot

* State

Enemy states:

IDLE

PATROL

CHASE

ATTACK

HURT

DEAD

STUNNED

FLEE

---

# 21. ENEMY TYPE 1 — WALKER

Basic enemy.

Moves left/right.

Turns at:

* Walls

* Edges

* Patrol limits

Weakness:

Jump attack.

Behavior:

PATROL

→

PLAYER DETECTED

→

CHASE

→

ATTACK

---

# 22. ENEMY TYPE 2 — SHELL CREATURE

Armored turtle-like original creature.

Behavior:

Normal

→ stomp

→ shell mode

Shell can then:

* Slide

* Hit enemies

* Bounce off walls

* Be kicked

* Be picked up

Add physics.

---

# 23. ENEMY TYPE 3 — FLYER

Flying enemy.

Movement:

Sin wave.

Variants:

* Horizontal

* Vertical

* Dive attack

Weakness:

Jump / ranged attack.

---

# 24. ENEMY TYPE 4 — SPIKE CRAWLER

Small ground creature.

Cannot be stomped.

Must:

* Avoid

* Shoot

* Dash over

---

# 25. ENEMY TYPE 5 — PROJECTILE ENEMY

Stationary enemy that launches projectiles.

Projectile patterns:

Straight

Arc

Burst

Delayed

---

# 26. ENEMY TYPE 6 — GHOST

Enemy follows player.

Behavior:

When player looks toward it:

Freeze.

When player looks away:

Move.

Make this a distinct mechanic.

---

# 27. ENEMY TYPE 7 — BURROWER

Moves underground.

Emerges near player.

Warning:

Ground particle indicator.

Then attack.

---

# 28. ENEMY TYPE 8 — CHARGER

Runs toward player when detected.

Can crash into walls.

Wall impact creates stun state.

---

# 29. ENEMY COMBAT

Player can defeat enemies using:

* Jump

* Fire projectile

* Special ability

* Star state

* Character-specific attack

Every enemy needs a weakness.

Avoid enemies that only function as HP sponges.

---

# 30. ENEMY REWARD SYSTEM

Enemy defeat can provide:

+Score

Possible:

* Coins

* Energy

* Combo

* Temporary buff

Combo example:

Enemy 1:

100

Enemy 2:

200

Enemy 3:

400

Enemy 4:

800

Reset combo after several seconds.

---

# 31. THROWABLE WEAPONS

Press X:

Primary attack.

Press CTRL:

Secondary/special ability.

Examples:

Fire character:

X = Fireball

Heavy character:

X = Rock projectile

Ice character:

X = Ice shard

Boomerang character:

X = Boomerang

Lightning character:

X = Lightning projectile

Water character:

X = Water blast

Wind character:

X = Wind projectile

---

# 32. CHARACTER-SPECIFIC ABILITIES

Every playable character should eventually feel mechanically different.

Do NOT make 40 characters with identical controls.

Each should have:

* Passive

* Primary attack

* Movement identity

* Special attack

* Weakness

* Jump profile

* Speed profile

---

# 33. 40 ORIGINAL PLAYABLE CHARACTERS

Create an original crossover-style roster inspired by different cartoon/movie/game archetypes WITHOUT copying copyrighted designs.

Example roster:

1. Riko — balanced mascot

2. Luna — agile moon warrior

3. Bolt — electric speedster

4. Ember — fire fighter

5. Frost — ice specialist

6. Terra — heavy earth warrior

7. Aero — aerial specialist

8. Nova — energy shooter

9. Dash — extreme speed

10. Echo — sonic attacker

11. Ivy — plant controller

12. Blaze — explosive attacker

13. Shadow — stealth character

14. Titan — heavy tank

15. Spark — chain-lightning character

16. Aqua — water specialist

17. Comet — aerial jumper

18. Flint — rock thrower

19. Zephyr — wind character

20. Orbit — gravity manipulation

21. Pixel — digital projectile user

22. Robo — mechanical character

23. Byte — hacking specialist

24. Coco — acrobatic character

25. Mimi — double-jump specialist

26. Rex — charging character

27. Pip — tiny character

28. Giga — giant character

29. Vex — teleport character

30. Sol — light-based character

31. Shade — shadow projectile user

32. Bloom — healing/support character

33. Fang — melee character

34. Glint — ranged character

35. Jett — dash specialist

36. Marble — rolling character

37. Wisp — ghost-like character

38. Kora — shield character

39. Orion — star-powered character

40. Max — balanced unlockable hero

For every character implement:

* Idle animation

* Walk

* Run

* Jump

* Fall

* Landing

* Hurt

* Death

* Attack

* Special attack

* Victory

* Power-up

* Transformation

* Damage

* Emote

---

# 34. CHARACTER ATTRIBUTE SYSTEM

Each character:

speed:

1–10

jump:

1–10

health:

1–10

attack:

1–10

range:

1–10

defense:

1–10

special:

1–10

Create a data-driven configuration.

Example:

CharacterData {

name

speed

jumpForce

acceleration

maxHealth

attackDamage

attackRange

projectileSpeed

specialCooldown

doubleJump

dash

}

---

# 35. LEVEL DESIGN PHILOSOPHY

Every mechanic should be introduced safely before being required.

Pattern:

INTRODUCE

↓

PRACTICE

↓

COMBINE

↓

TEST

↓

REWARD

Example:

Introduce enemy.

Then introduce enemy + pit.

Then enemy + block.

Then enemy + moving platform.

Then reward player.

---

# 36. LEVEL 1 FLOW

LEVEL START

↓

Safe ground

↓

Coins

↓

First question block

↓

First enemy

↓

Small gap

↓

Platform

↓

Second enemy

↓

Breakable block

↓

Power-up tutorial

↓

Vertical platform section

↓

Coin trail

↓

Pipe / secret route

↓

Checkpoint

↓

Mixed enemies

↓

Moving platform

↓

Large gap

↓

Optional shortcut

↓

Mini challenge

↓

Final approach

↓

Final enemy group

↓

Flag pole

↓

LEVEL COMPLETE

---

# 37. SECRET ROUTES

Create at least 2 secrets in Level 1.

SECRET A:

Hidden block reveals platform.

Platform leads to:

* Coin room

* Bonus collectible

* Alternate route

SECRET B:

Pipe/tunnel leads to:

* Underground bonus room

* Large coin collection

* Exit ahead of normal route

Secrets should reward exploration but never make the main route impossible to understand.

---

# 38. SHORTCUT SYSTEM

The game should reward skilled players.

Possible shortcuts:

* High platform route

* Hidden tunnel

* Enemy bounce route

* Breakable wall

* Dash path

* Advanced jump sequence

Normal player:

Long route.

Skilled player:

Short route.

---

# 39. CAMERA

Use side-scrolling camera.

Camera follows player horizontally.

Do not lock camera directly to player position.

Use:

Smooth follow

Look-ahead

Dead zone

Boundary limits

Vertical adjustment

Camera should move slightly ahead in the direction the player is running.

Example:

Player moving right

→ camera looks approximately 20–30% ahead.

---

# 40. CAMERA EFFECTS

Implement:

* Screen shake

* Damage shake

* Enemy hit shake

* Block destruction shake

* Boss shake

* Power-up transformation effect

* Goal flag camera transition

Do not overuse screen shake.

---

# 41. WORLD BACKGROUND

Create layered parallax.

Layer 1:

Sky

Layer 2:

Clouds

Layer 3:

Distant mountains

Layer 4:

Trees

Layer 5:

Foreground terrain

Layer 6:

Gameplay objects

Use different scroll speeds.

---

# 42. VISUAL STYLE

Target:

Colorful

Friendly

High readability

Modern 2D

Smooth animations

Strong silhouettes

Soft lighting

Bright environments

Subtle particles

Avoid:

Photorealism.

Target:

Stylized animated platformer.

---

# 43. TILE SYSTEM

Use grid-based level construction.

Recommended base tile:

32x32 OR 48x48.

All collision geometry should align with the grid where possible.

Tile types:

Ground

Platform

Brick

Question

Hidden

Slope

Ice

Mud

Water

Lava

Spike

Decoration

Level designers should be able to assemble levels quickly.

---

# 44. PHYSICS

Use deterministic-friendly platformer physics.

Required collision categories:

PLAYER

GROUND

ENEMY

PROJECTILE

ITEM

PLATFORM

HAZARD

COLLECTIBLE

TRIGGER

Implement:

AABB or capsule collision depending on engine.

Ensure:

No tunneling through high-speed objects.

Use continuous collision detection for projectiles.

---

# 45. ITEMS

Create an extensible item registry.

Items:

Coin

Big Coin

Growth Orb

Fire Crystal

Star Core

Shield

Speed Boost

Extra Life

Magnet

Dash Energy

Health

Temporary Shield

Every item should implement:

Spawn

Idle

Collect

Effect

Destroy

---

# 46. BLOCK SYSTEM

Create:

BlockBase

Subclasses/data:

QuestionBlock

BrickBlock

HiddenBlock

MetalBlock

IceBlock

MysteryBlock

SwitchBlock

Each supports:

Hit

Break

Activate

Animate

Reward

---

# 47. PIPES / TUNNELS

Create interactive transportation objects.

Player enters.

Screen transition.

Move to target location.

Support:

Same-level secret route.

Future:

World transition.

---

# 48. FLAG / LEVEL END

When player reaches goal:

Disable ordinary player controls.

Play:

Goal animation.

Calculate:

Remaining time

× multiplier.

Calculate:

Coins

Enemy defeats

Secret collectibles

Completion time

Combo

Then show:

LEVEL COMPLETE

SCORE

COINS

TIME BONUS

SECRETS

RANK

---

# 49. SCORE SYSTEM

Score sources:

Coin:

+100

Enemy:

+100 base

Power-up:

+500

Secret:

+1000

Fast completion:

time bonus

Level completion:

+5000

Create combo multiplier.

---

# 50. TIME SYSTEM

Level 1:

300 seconds.

Timer displayed in upper-right.

Timer pauses:

* Pause menu

* Cutscenes

* Level completion

Timer does NOT pause during:

* Normal gameplay

* Inventory

* Exploration

When timer reaches zero:

Character loses life.

---

# 51. HUD

Top HUD:

LEFT:

Character icon

Lives

Center:

World / Level

RIGHT:

Coins

Score

Timer

Power-up indicator

Keep HUD minimal.

Use readable typography.

---

# 52. PAUSE MENU

ESC:

PAUSE

Options:

RESUME

RESTART CHECKPOINT

OPTIONS

CONTROLS

QUIT LEVEL

Do not lose progress accidentally.

Confirmation dialog:

"Are you sure?"

---

# 53. SAVE SYSTEM

Implement persistent save.

Save:

* Current world

* Current level

* Completed levels

* Highest score

* Best time

* Collected secret items

* Unlocked characters

* Character upgrades

* Coins

* Lives if desired

* Checkpoint information where appropriate

* Settings

Use versioned save schema.

Example:

save_version = 1

When schema changes:

Migration system.

---

# 54. SAVE SLOTS

Create:

SAVE SLOT 1

SAVE SLOT 2

SAVE SLOT 3

Each displays:

Player name

World progress

Completion percentage

Play time

Last played

---

# 55. AUTO SAVE

Auto-save:

After level completion.

After major unlock.

After checkpoint.

Before leaving level.

Do not constantly write to disk every frame.

---

# 56. SETTINGS

Add:

Master Volume

Music Volume

SFX Volume

Fullscreen

Resolution

VSync

Camera Shake

Screen Flash

Difficulty

Language

Controller vibration

Accessibility

---

# 57. ACCESSIBILITY

Include:

Colorblind-friendly effects.

Screen shake toggle.

Reduced flash option.

Large text.

Subtitles.

Remappable controls.

Controller support.

Hold/toggle options.

---

# 58. AUDIO SYSTEM

Create original music.

No copyrighted Mario music.

Music layers:

Level theme

Underground

Bonus

Boss

Invincibility

Victory

Game over

World map

Dynamic transitions.

Example:

NORMAL MUSIC

↓

STAR POWER

↓

TEMPORARY HIGH-ENERGY MUSIC

↓

POWER ENDS

↓

NORMAL MUSIC

---

# 59. SOUND EFFECTS

Create original sounds for:

Jump

Land

Coin

Question block

Block break

Power-up

Damage

Enemy defeat

Projectile

Dash

Checkpoint

Pipe

Goal

Life gained

Life lost

Menu

Button click

Use audio pooling.

---

# 60. PARTICLES

Particles:

Coins

Enemy defeat

Block destruction

Landing dust

Jump dust

Power-up

Projectile impact

Dash trail

Checkpoint activation

Goal celebration

Keep particle count controlled.

---

# 61. ANIMATION

Use animation state machine.

Minimum:

Idle

Walk

Run

Jump

Fall

Attack

Hurt

Death

Victory

Animations should blend smoothly.

Avoid frame popping.

---

# 62. HIT FEEDBACK

When hitting enemy:

* Small freeze frame

* Particle

* Sound

* Enemy reaction

* Score popup

Use very short hit-stop.

Approximately:

50–100 ms.

Don't freeze gameplay too long.

---

# 63. ENEMY SPAWNING

Enemies should be level-defined.

Do not randomly spawn enemies in Level 1.

Spawn data:

position

type

direction

patrolRange

speed

health

drop

activationRange

---

# 64. OBJECT POOLING

Pool:

Projectiles

Particles

Coins where appropriate

Temporary effects

Enemies where useful

Avoid unnecessary object creation every frame.

---

# 65. PERFORMANCE

Target:

60 FPS.

Avoid:

* Excessive physics calculations

* Per-frame allocations

* Huge textures

* Unnecessary AI updates

* Unbounded particles

Only simulate distant enemies when required.

---

# 66. WORLD STRUCTURE

Structure future worlds as:

World 1 — Grasslands

World 2 — Desert

World 3 — Jungle

World 4 — Ice

World 5 — Ocean

World 6 — Sky

World 7 — Volcano

World 8 — Castle / Final World

Each world:

6–8 stages

including:

Normal levels

Bonus level

Secret level

Boss level

---

# 67. LEVEL TYPES

Future:

Normal

Underground

Water

Auto-scroll

Vertical

Speedrun

Puzzle

Airship

Castle

Boss

Secret

---

# 68. BOSS ARCHITECTURE

Do NOT hardcode bosses.

Create:

BossBase

Boss phases.

Each boss:

Phase 1

Phase 2

Enrage

Defeat

Boss abilities:

Projectile

Jump

Charge

Ground pound

Summon enemies

Platforms

Environmental hazards

---

# 69. FINAL BOSS ARCHITECTURE

Eventually create an ORIGINAL giant turtle/dragon-like villain, not Bowser.

Boss arena:

Suspension bridge-inspired structure, but with an original art direction and layout.

Boss can:

* Throw projectiles

* Breathe elemental attack

* Jump

* Shockwave

* Summon enemies

* Destroy bridge sections

Player wins using:

Movement

Environmental mechanisms

Attacks

Timing

---

# 70. CHARACTER UNLOCK SYSTEM

Start with:

1 playable character.

Unlock others through:

* Completing levels

* Secret collectibles

* High score

* Side quests

* Bonus stages

Every unlocked character should be usable in previously completed levels.

---

# 71. CHARACTER SELECT

Screen:

Character cards.

Show:

Name

Portrait

Speed

Jump

Attack

Special

Difficulty

Ability description

Selected character has animation.

---

# 72. CHARACTER BALANCING

No character should be objectively best.

Create tradeoffs.

Example:

Fast character:

High speed

Low health

Heavy character:

High health

Low speed

Ranged:

High range

Low melee damage

Double-jump:

Excellent mobility

Low attack

---

# 73. COMBO SYSTEM

Skill-based combo.

Example:

Enemy → coin → block → enemy → coin.

Combo increases.

Display:

COMBO x2

COMBO x3

COMBO x4

Combo decays after inactivity.

---

# 74. SPEEDRUN SUPPORT

Eventually support:

Level timer

Personal best

Best time

Ghost replay

Split times

Speedrun leaderboard architecture

Do NOT require online infrastructure initially.

Local ghost is enough for v1.

---

# 75. LEVEL COMPLETION GRADING

Rank:

S

A

B

C

Based on:

* Time

* Coins

* Secrets

* Damage taken

* Enemy defeats

Example:

S:

Fast

80%+ coins

All secrets

No damage

---

# 76. LEVEL 1 SECRET DESIGN

SECRET 1:

High platform.

Reward:

Golden Relic.

SECRET 2:

Breakable wall.

Reward:

Bonus coin room.

SECRET 3:

Hidden block chain.

Reward:

Extra life.

---

# 77. BONUS ROOM

Create a small bonus room.

Rules:

No enemies.

Lots of coins.

Time-limited.

Player enters through hidden route.

At end:

Return player to main level.

---

# 78. TUTORIAL DESIGN

Do NOT create a long tutorial screen.

Teach through gameplay.

Example:

Coins above player:

Player naturally jumps.

Question block:

Player hits it.

Enemy:

Player learns stomp.

Power-up:

Player discovers transformation.

Breakable block:

Player realizes power-up capability.

---

# 79. LEVEL 1 APPROXIMATE SEQUENCE

0:00

Spawn.

Teach movement.

0:20

Coins.

0:35

Question block.

0:50

First enemy.

1:10

Small gap.

1:30

First power-up.

1:50

Breakable blocks.

2:15

Vertical section.

2:40

Secret area.

3:00

Checkpoint.

3:20

Moving platforms.

3:50

Shortcut.

4:10

Final enemy group.

4:30

Goal flag.

---

# 80. LEVEL EDITOR

Create data-driven levels.

Level data should define:

Tiles

Objects

Enemies

Items

Triggers

Checkpoints

Secret locations

Camera bounds

Music

Time limit

Goal

Do not hardcode Level 1 geometry inside gameplay code.

---

# 81. LEVEL DATA EXAMPLE

Level:

world = 1

level = 1

name = "Green Meadow"

time_limit = 300

spawn_position = (...)

goal_position = (...)

objects = [...]

enemies = [...]

items = [...]

checkpoints = [...]

secrets = [...]

---

# 82. GAME MANAGER ARCHITECTURE

Create:

GameManager

LevelManager

PlayerManager

AudioManager

SaveManager

UIManager

InputManager

CameraManager

ParticleManager

PoolManager

EnemyManager

ItemManager

AchievementManager

SettingsManager

---

# 83. EVENTS

Use event-driven architecture.

Examples:

OnPlayerJump

OnPlayerDamage

OnEnemyDefeated

OnCoinCollected

OnPowerUpCollected

OnCheckpointReached

OnLevelComplete

OnPlayerDeath

OnTimerExpired

OnCharacterUnlocked

OnSaveCompleted

This avoids tightly coupling every system.

---

# 84. DEVELOPMENT PHASES

PHASE 1:

Player movement

PHASE 2:

Physics

PHASE 3:

Basic level

PHASE 4:

Camera

PHASE 5:

Enemy

PHASE 6:

Coin

PHASE 7:

Question block

PHASE 8:

Power-up

PHASE 9:

Combat

PHASE 10:

Checkpoint

PHASE 11:

Secret areas

PHASE 12:

Goal flag

PHASE 13:

HUD

PHASE 14:

Save system

PHASE 15:

Audio

PHASE 16:

Particles

PHASE 17:

Polish

PHASE 18:

QA

---

# 85. FIRST PLAYABLE BUILD

Before creating 40 characters, finish this:

One character.

One environment.

One level.

Three enemy types.

Coins.

Question blocks.

Breakable blocks.

Two power-ups.

Checkpoint.

Secret area.

Goal flag.

HUD.

Timer.

Lives.

Save.

Pause.

Level completion screen.

The first build must already be FUN.

---

# 86. LEVEL 1 ACCEPTANCE TEST

A new player should be able to:

* Move without explanation

* Jump without confusion

* Defeat first enemy

* Collect coins

* Understand question blocks

* Obtain power-up

* Understand transformation

* Reach checkpoint

* Discover at least one secret

* Finish level

* Restart after death

* Save progress

---

# 87. BUG TESTING

Test:

* Player stuck in wall

* Player falling through floor

* Double jump infinite

* Enemy stuck

* Projectile through wall

* Power-up clipping

* Camera leaving level

* Coins spawning incorrectly

* Checkpoint not saving

* Save corruption

* Timer negative

* Death during transition

* Goal triggered twice

* Rapid attack spam

* Pause during cutscene

* Restart during power-up

---

# 88. EDGE CASES

Test:

Power-up collected exactly when player takes damage.

Enemy dies exactly when player dies.

Player reaches goal while timer reaches zero.

Player enters pipe while enemy attacks.

Player leaves screen boundaries.

Player closes game during save.

Player changes character while powered up.

Player loads old save after game update.

---

# 89. GAME FEEL REQUIREMENT

The most important target is not the amount of content.

The priority is:

1. Responsive controls

2. Good jump

3. Good collision

4. Good camera

5. Clear visuals

6. Satisfying feedback

7. Strong level design

A smaller polished game is better than a giant buggy game.

---

# 90. VISUAL READABILITY

Every gameplay object should be immediately readable.

Player:

Highest contrast silhouette.

Enemy:

Clearly dangerous.

Coin:

Clearly collectible.

Power-up:

Clearly beneficial.

Hazard:

Clearly dangerous.

Goal:

Clearly visible.

Avoid excessive background clutter.

---

# 91. ART DIRECTION

Create a cohesive original art bible.

Palette:

Bright natural colors.

Shapes:

Rounded, exaggerated.

Terrain:

Stylized.

Characters:

Expressive.

Enemies:

Readable silhouettes.

Effects:

Soft particles.

The game should look like a polished modern indie platformer.

---

# 92. UI STYLE

Use:

Large readable typography.

Rounded panels.

Subtle transitions.

Animated counters.

Minimal clutter.

Menus:

Main Menu

Play

Character Select

World Select

Settings

Save Select

Credits

Quit

---

# 93. MAIN MENU

Animated background.

Hero performs idle animation.

Buttons:

PLAY

CHARACTERS

WORLD

SETTINGS

CREDITS

QUIT

Save slot visible.

---

# 94. LEVEL INTRO

Before Level 1:

WORLD 1

GREEN MEADOW

Display for ~2 seconds.

Then gameplay.

Do not create a long loading screen.

---

# 95. LEVEL COMPLETE

Show:

LEVEL COMPLETE!

TIME

COINS

SECRETS

ENEMIES

SCORE

RANK

Then:

NEXT LEVEL

REPLAY

WORLD MAP

---

# 96. WORLD MAP

Future architecture.

Player marker.

Completed levels.

Locked levels.

Secret paths.

Boss levels.

World completion percentage.

---

# 97. ACHIEVEMENTS

Create achievement system.

Examples:

First Step

Collect 100 Coins

Defeat 100 Enemies

Find First Secret

No Damage Level

Speed Runner

Power Master

Treasure Hunter

Complete World 1

Unlock Every Character

---

# 98. MODULARITY

Every major mechanic must be reusable.

Don't write:

if level == 1

everywhere.

Instead:

Level configuration.

Character configuration.

Enemy configuration.

Item configuration.

Ability configuration.

---

# 99. DATA-DRIVEN DESIGN

Prefer:

JSON

YAML

ScriptableObjects

Resources

or equivalent engine-native data system.

Game designers should be able to modify:

Enemy speed

Coin value

Jump force

Power-up duration

Level timer

without modifying core gameplay code.

---

# 100. PROJECT STRUCTURE

Use a clean architecture such as:

/Game

/Characters

/Enemies

/Items

/Levels

/UI

/Audio

/Effects

/Physics

/Save

/Data

/Systems

/Managers

/Utilities

Separate data from behavior.

---

# 101. CODE QUALITY

Code must be:

Readable

Modular

Documented where necessary

Testable

Type-safe where applicable

No giant classes.

No duplicated logic.

No magic numbers scattered everywhere.

Centralize configuration.

---

# 102. DEBUG MODE

Implement developer debug mode.

Functions:

F1 = Toggle hitboxes

F2 = Toggle FPS

F3 = Give power-up

F4 = Kill player

F5 = Teleport checkpoint

F6 = Skip section

F7 = Spawn enemy

F8 = Give coins

F9 = Complete level

F10 = Toggle invincibility

Do not expose debug mode in release build.

---

# 103. DEBUG UI

Show:

FPS

Player position

Velocity

Grounded

Current state

Health

Power-up

Enemy count

Projectile count

Current checkpoint

Level timer

---

# 104. TEST MAP

Create a developer test level containing:

Flat ground

Slope

Pit

Wall

Enemy

Moving platform

Question block

Breakable block

Power-up

Projectile target

Checkpoint

Pipe

Goal

---

# 105. MOBILE SUPPORT ARCHITECTURE

Don't implement mobile controls immediately, but make controls abstract enough to support:

Touch joystick

Jump button

Attack button

Ability button

Pause

Later.

---

# 106. FUTURE MULTIPLAYER

Architecture should not prevent future local multiplayer.

Eventually support:

Player 1

Player 2

Player 3

Player 4

Each gets:

Independent controller.

Camera adjusts intelligently.

Do not build networking yet.

---

# 107. FUTURE CONTENT

Architecture should support:

40 characters

8 worlds

50+ levels

10+ power-ups

30+ enemy types

8 bosses

Secret levels

Bonus stages

Challenge modes

Speedrun mode

Character customization

Achievements

---

# 108. IMPORTANT PRIORITY

DO NOT ATTEMPT TO BUILD EVERYTHING AT ONCE.

Build vertical slice first:

Character

+

Movement

+

One enemy

+

Coins

+

Blocks

+

Power-up

+

Level

+

Checkpoint

+

Goal

+

HUD

+

Save

Then polish it.

Only after Level 1 feels excellent should additional characters and worlds be implemented.

---

# 109. ART / ASSET PLACEHOLDERS

Until custom art is ready:

Use simple original placeholder shapes.

Examples:

Hero → capsule/rectangle

Enemy → circle/body shape

Coin → rotating rectangle/circle

Block → colored square

Question block → square with "?"

Power-up → glowing sphere

Goal → flag and pole

Never download or copy copyrighted Mario sprites.

Make replacement assets later.

---

# 110. IMPLEMENTATION ORDER

Start with:

1. Project setup

2. Scene setup

3. Input system

4. Player controller

5. Physics

6. Camera

7. Tilemap

8. First level geometry

9. Enemy

10. Coin

11. Question block

12. Power-up

13. Attack

14. Checkpoint

15. Goal

16. HUD

17. Timer

18. Lives

19. Death

20. Save system

21. Pause

22. Level completion

23. Sound

24. Particles

25. Animation

26. Polish

27. Testing

Do NOT move to the next major phase until the previous phase works.

---

# 111. FINAL LEVEL 1 EXPERIENCE

The finished first level should feel like:

START

→

Player learns movement

→

Coins create movement targets

→

Question block teaches interaction

→

Enemy teaches combat

→

Gap teaches jumping

→

Power-up introduces transformation

→

Breakable blocks reward exploration

→

Secret route rewards curiosity

→

Checkpoint provides safety

→

Moving platforms introduce timing

→

Shortcut rewards advanced movement

→

Final challenge tests all learned mechanics

→

Goal flag

→

Victory animation

→

Score screen

→

Save progress

→

Unlock Level 2

The player should finish Level 1 feeling:

"I understand this game."

"I want to play Level 2."

---

# 112. IMPORTANT DEVELOPMENT RULE

Do not start by creating 40 characters.

Do not start by creating eight worlds.

Do not start with complicated boss battles.

First make the first 5 minutes extremely polished.

The game must prioritize:

FUN

→

RESPONSIVENESS

→

READABILITY

→

LEVEL DESIGN

→

POLISH

→

CONTENT

---

# 113. FINAL DELIVERABLE FOR VERSION 0.1

Produce a playable build containing:

LEVEL 1

ONE ORIGINAL HERO

3 ENEMY TYPES

COINS

QUESTION BLOCKS

BREAKABLE BLOCKS

2 POWER-UPS

ONE SECRET AREA

ONE BONUS AREA

ONE CHECKPOINT

ONE SHORTCUT

ONE GOAL FLAG

TIMER

LIVES

HUD

PAUSE MENU

SAVE SYSTEM

LEVEL COMPLETE SCREEN

ORIGINAL SOUND PLACEHOLDERS

ORIGINAL GRAPHIC PLACEHOLDERS

DEBUG MODE

README

BUILD/RUN INSTRUCTIONS

---

# 114. DEFINITION OF DONE

Level 1 is complete only when:

* The player can start the game.

* The player can select a save slot.

* The level loads correctly.

* Player movement feels responsive.

* Jump physics are reliable.

* Camera follows correctly.

* Enemies work.

* Coins work.

* Blocks work.

* Power-ups work.

* Combat works.

* Death works.

* Checkpoints work.

* Secrets work.

* Timer works.

* Goal works.

* Score works.

* Level completion works.

* Save works.

* Loading works.

* Restart works.

* Pause works.

* No game-breaking collision bugs remain.

* The game runs at a stable target framerate.

* The entire Level 1 can be completed from beginning to end.

ONLY after this is true should World 1 Level 2 begin.

---

# 115. ENGINEERING PRINCIPLE

Build this as a real game, not a visual demo.

Every major mechanic must have:

DATA

+

LOGIC

+

COLLISION

+

ANIMATION

+

AUDIO

+

UI FEEDBACK

+

SAVE STATE

+

TEST COVERAGE

Make the architecture scalable enough that Level 1 is only the first piece of a much larger platformer.

Start with Level 1.

Make it excellent.

Then expand.

# 116. RECOMMENDED TECHNOLOGY STACK

The game must be web-first and playable directly in a modern browser.

Evaluate the following technologies:

* Phaser.js

* p5.js

* Three.js

* Plain HTML5 Canvas + JavaScript/TypeScript

* Next.js

## PRIMARY RECOMMENDATION — PHASER.JS

Use:

**Phaser.js + TypeScript**

as the primary game engine for the actual 2D platformer.

Reason:

Phaser is designed specifically for 2D games and provides strong support for:

* Sprite rendering

* Tilemaps

* Arcade physics

* Collision detection

* Cameras

* Animations

* Particles

* Input

* Audio

* Scenes

* Asset loading

* Game loops

* Scaling

* Web deployment

The game should not be implemented as a normal React/Next.js application with the game logic mixed into React components.

Phaser should own the gameplay loop.

---

# 117. OPTIONAL NEXT.JS ARCHITECTURE

If Next.js is used, use it as the surrounding application layer.

Recommended architecture:

NEXT.JS

│

├── Main Menu

├── Login / Profile

├── Character Collection

├── World Map UI

├── Settings

├── Leaderboards

├── Achievements

├── Save/Cloud Sync

├── Game Loading Screen

└── Phaser Game

│

├── Player

├── Enemies

├── Levels

├── Physics

├── Items

├── Camera

├── Audio

└── Game State

The actual gameplay should run inside Phaser.

Next.js should NOT manage:

* Frame-by-frame movement

* Physics

* Collision detection

* Enemy AI

* Projectile simulation

* Game loops

React/Next.js is for application-level UI.

Phaser is for gameplay.

---

# 118. PHASER + NEXT.JS INTEGRATION

Recommended structure:

/app

/page.tsx

/game

/page.tsx

/game

/scenes

/entities

/characters

/enemies

/items

/levels

/systems

/physics

/ui

/data

/audio

/effects

/utils

/components

MainMenu

CharacterSelect

WorldMap

Settings

Leaderboard

GameHUD

When the player enters:

/game

initialize Phaser.

The Phaser canvas should occupy the gameplay region.

React overlays can be used only where appropriate, such as:

* Pause menu

* Settings

* Character selection

* Account information

* Leaderboards

For gameplay-critical UI, prefer Phaser UI or canvas rendering so it remains synchronized with the game loop.

---

# 119. TYPESCRIPT

Use TypeScript rather than plain JavaScript for the main codebase.

Benefits:

* Strong typing

* Better refactoring

* Safer entity systems

* Better editor support

* Easier large-scale expansion

* Easier character/enemy data definitions

Avoid:

any

unless genuinely necessary.

Use interfaces/types for:

CharacterData

EnemyData

LevelData

ItemData

PowerUpData

SaveData

AbilityData

CheckpointData

---

# 120. PACKAGE SETUP

Recommended initial stack:

Frontend:

Next.js

Language:

TypeScript

Game:

Phaser.js

Build:

Next.js/Vite-compatible tooling as appropriate

Styling:

CSS / Tailwind where useful for application UI

State:

Simple game-state manager inside Phaser

Persistence:

localStorage initially

Future:

Cloud database / backend for accounts and cross-device saves

---

# 121. ALTERNATIVE — PURE PHASER APP

For the first prototype, a standalone Phaser application is acceptable and may actually be preferable.

Example:

/src

main.ts

game/

config.ts

scenes/

entities/

systems/

levels/

data/

/public

assets/

This should be the fastest route to a playable Level 1.

Do not introduce Next.js complexity unless the project needs:

* Accounts

* Online leaderboards

* Cloud saves

* Web profiles

* Multiplayer services

* Content-management tools

* Large application UI

---

# 122. P5.JS OPTION

p5.js may be used for:

* Gameplay experiments

* Physics prototypes

* Movement testing

* Procedural experiments

* Visual experiments

* Animation prototypes

However, do not prefer p5.js over Phaser for the production version if the project requires:

* Multiple levels

* Complex collisions

* Tilemaps

* Many enemies

* Scene management

* Save systems

* Large content architecture

p5.js is an excellent experimentation tool, but Phaser should be preferred for the main game.

---

# 123. THREE.JS OPTION

Three.js should only be selected if the game is intentionally redesigned as:

* 3D platformer

* 2.5D game

* 3D world with side-scrolling camera

* 3D characters

* 3D environments

For the current goal:

**Do NOT use Three.js as the primary engine.**

The target is a polished 2D side-scrolling platformer.

Phaser is better aligned with that requirement.

---

# 124. PLAIN HTML5 CANVAS OPTION

Plain Canvas + TypeScript is allowed for an extremely lightweight prototype.

Implement manually:

* Game loop

* Rendering

* Physics

* Collision

* Camera

* Animation

* Tilemaps

* Input

* Audio

* Entity management

However, do not rebuild an entire game engine unnecessarily.

If the project begins requiring:

* Many enemies

* Tilemaps

* Particles

* Scenes

* Complex collision

* Multiple worlds

* Character switching

migrate to or use Phaser.

---

# 125. TECHNOLOGY DECISION

Default decision:

**PHASER.JS + TYPESCRIPT**

Optional application shell:

**NEXT.JS**

Recommended final architecture:

Next.js

+

Phaser.js

+

TypeScript

For the initial Level 1 vertical slice:

Prefer:

**Phaser + TypeScript**

and add Next.js only when application-level features become necessary.

---

# 126. GAME ENGINE ARCHITECTURE

Phaser Scenes:

BootScene

PreloadScene

MainMenuScene

CharacterSelectScene

WorldMapScene

Level1Scene

BonusScene

PauseScene

GameOverScene

LevelCompleteScene

Future:

Level2Scene

Level3Scene

BossScene

etc.

Avoid creating hundreds of completely independent scene implementations if they share common logic.

Create reusable scene/base systems where appropriate.

---

# 127. PHASER PHYSICS

Start with Phaser Arcade Physics for Level 1.

Use:

* Gravity

* Velocity

* Acceleration

* Collision

* Overlap

* Static bodies

* Dynamic bodies

Use custom calculations for:

* Coyote time

* Jump buffering

* Variable jump height

* Character-specific movement

* Advanced enemy behavior

Do not rely entirely on engine defaults.

Tune the physics manually until movement feels responsive.

---

# 128. TILEMAP ARCHITECTURE

Use Phaser Tilemaps for level geometry.

Recommended:

TMX / JSON / Phaser-compatible tile data

Level geometry should contain:

* Ground

* Platforms

* Hazards

* Pipes

* Hidden blocks

* Question blocks

* Breakable blocks

* Decorative layers

Separate:

Collision layer

from:

Background layer

from:

Foreground decoration

from:

Interactive object layer

---

# 129. ASSET PIPELINE

Do not hardcode visual assets directly inside game logic.

Use an asset registry.

Example:

assets/

characters/

enemies/

items/

tiles/

backgrounds/

ui/

effects/

audio/

fonts/

Create an asset manifest for loading.

Use placeholder assets during development.

Replace placeholders with original artwork later.

---

# 130. RESOLUTION / SCALING

Target:

16:9

Recommended internal resolution:

960 × 540

or

1280 × 720

Scale to the browser window.

Support:

Desktop

Laptop

Tablet where reasonable

Maintain aspect ratio.

Do not stretch gameplay non-uniformly.

---

# 131. RESPONSIVE GAME CANVAS

The game canvas should:

* Center horizontally

* Maintain aspect ratio

* Scale cleanly

* Handle browser resize

* Handle fullscreen

* Support device pixel ratio correctly

Avoid blurry rendering.

Use pixel-art-friendly scaling only if the final visual style requires it.

For high-resolution smooth illustration, use appropriate texture scaling instead.

---

# 132. INPUT ABSTRACTION

Do not directly hardcode:

KeyboardEvent → Player Action

Instead:

InputManager

maps:

Keyboard

Gamepad

Touch

to:

MOVE_LEFT

MOVE_RIGHT

JUMP

ATTACK

SPECIAL

DASH

PAUSE

This allows future controller/mobile support without rewriting gameplay.

---

# 133. GAME STATE

Create global game state:

GameState

containing:

currentWorld

currentLevel

currentCharacter

lives

coins

score

powerUp

checkpoint

timer

secrets

unlockedCharacters

Do not use dozens of unrelated global variables.

---

# 134. CHARACTER DATA

Example TypeScript structure:

interface CharacterData {

id: string;

name: string;

```

speed: number;

acceleration: number;

jumpForce: number;

maxHealth: number;

attackDamage: number;

attackRange: number;

projectileSpeed: number;

canDoubleJump: boolean;

canDash: boolean;

specialAbility: string;

```

}

Store character definitions separately from PlayerController.

---

# 135. ENEMY DATA

Example:

interface EnemyData {

id: string;

name: string;

```

health: number;

speed: number;

damage: number;

detectionRange: number;

patrolRange: number;

canJump: boolean;

canFly: boolean;

canShoot: boolean;

weakness: string[];

```

}

---

# 136. LEVEL DATA

Example:

interface LevelData {

id: string;

world: number;

level: number;

```

name: string;

timeLimit: number;

spawn: {

    x: number;

    y: number;

};

goal: {

    x: number;

    y: number;

};

checkpoints: CheckpointData[];

enemies: EnemySpawnData[];

items: ItemSpawnData[];

secrets: SecretData[];

```

}

---

# 137. FIRST TECHNICAL MILESTONE

The first implementation should NOT contain:

40 characters.

8 worlds.

Online multiplayer.

Online accounts.

Complex backend.

Large asset library.

Instead build:

Phaser

*

TypeScript

*

Level 1

*

One original hero

*

Basic enemy

*

Coins

*

Question blocks

*

Breakable blocks

*

Power-up

*

Projectile

*

Checkpoint

*

Goal

*

HUD

*

Save

---

# 138. FIRST RUN COMMANDS

The project should eventually be straightforward to run.

Example:

npm install

npm run dev

Then open the local development URL.

Production:

npm run build

npm run start

If Next.js is not needed yet:

npm run dev

should launch the Phaser game directly.

---

# 139. FINAL TECHNOLOGY REQUIREMENT

Before implementing the project, determine whether the current codebase is:

A. Phaser-only

B. Next.js + Phaser

C. Canvas-only prototype

Then choose the simplest architecture capable of supporting the requested functionality.

Default:

**Phaser.js + TypeScript**

Preferred production web architecture:

**Next.js + Phaser.js + TypeScript**

Do not select a heavier technology merely because it is popular.

Choose the technology that makes the game:

* Fast

* Responsive

* Maintainable

* Extensible

* Easy to deploy

* Easy to test

* Easy to expand into multiple worlds and characters

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a05e9e5d-aa81-470c-9562-8fa50274a538).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
