// Level definitions - tile-based map system  
const TILE = 32;

// Parse level rows into structured data
function parseLevel(rows, name, bg, groundColor, blockColor) {
    const solidBlocks = [];
    const coins = [];
    const enemies = [];
    let marioX = 96; // Default spawn X (centered on column 3)
    let pipes = [];
    let flagPoleData = null;

    for (let row = 0; row < rows.length; row++) {
        const line = rows[row];
        for (let col = 0; col < line.length; col++) {
            const ch = line[col];
            const x = col * TILE;
            const y = row * TILE;

            switch(ch) {
                case '#': // solid ground block
                    solidBlocks.push({ x, y, w: TILE, h: TILE, type: 'ground', color: groundColor });
                    break;
                    
                case '?': // question block (gives coin when hit from below)
                    solidBlocks.push({ 
                        x, y, w: TILE, h: TILE, type: 'question', 
                        hit: false, color: '#FBD007' 
                    });
                    break;
                    
                case 'X': // brick block
                    solidBlocks.push({ x, y, w: TILE, h: TILE, type: 'brick', color: blockColor });
                    break;
                    
                case 'C': // floating coin to collect
                    coins.push({ x: x + 6, y: y + 4 });
                    break;
                    
                case 'G': // goomba enemy
                    enemies.push({ x, y: y - 4 });
                    break;
                    
                case 'M': // Mario spawn point
                    marioX = col * TILE + TILE / 2; // Center in tile
                    break;
                    
                case 'F':
                case 'f': { // flag pole (level end)
                    const poleCol = col;
                    const flagTopRow = row;

                    // Find the actual ground row at the flag pole column
                    let groundRow = rows.length - 1;
                    for (let r = flagTopRow + 1; r < rows.length; r++) {
                        const ch = rows[r][poleCol];
                        if (ch === '#' || ch === 'p' || ch === 'P' || ch === 'X') {
                            groundRow = r;
                            break;
                        }
                    }

                    for (let r = flagTopRow + 1; r <= groundRow; r++) {
                        solidBlocks.push({ 
                            x: poleCol * TILE + 12, 
                            y: r * TILE, 
                            w: 8, h: TILE, 
                            type: 'pole' 
                        });
                    }

                    if (!flagPoleData) {
                        const totalHeight = (groundRow - flagTopRow + 1) * TILE;
                        flagPoleData = { 
                            x: poleCol * TILE + 12, 
                            y: flagTopRow * TILE,
                            height: totalHeight 
                        };
                    }
                    break;
                }
                    
                case 'p': // pipe top rim
                    pipes.push({ x, y, width: TILE, height: TILE * 2 });
                    solidBlocks.push({ 
                        x: x + 4, y: y + TILE/2, w: TILE - 8, h: TILE/2, type: 'pipe' 
                    });
                    break;
                    
                case 'P': // pipe body (extends from previous pipe)
                    const lastPipe = pipes[pipes.length - 1];
                    if (lastPipe && lastPipe.x === x) {
                        lastPipe.y = y + TILE * 2;
                        lastPipe.height += TILE;
                    } else {
                        pipes.push({ x, y: y + TILE * 2, width: TILE, height: TILE });
                    }
                    solidBlocks.push({ 
                        x: x + 4, y, w: TILE - 8, h: TILE, type: 'pipe' 
                    });
                    break;
            }
        }
    }

    return { rows, bg, groundColor, blockColor, name, solidBlocks, coins, enemies, marioX, pipes, flagPoleData };
}

// ===================== LEVEL 1-1: Green Hills (introductory) =====================
const level1_1 = parseLevel([
    '                                                                                                                        ',
    '                                                                                                                        ',
    '                                                                                                                        ',
    '         ?               XXXXX                                                                                          ',
    '                                     C                                                                                  ',
    '         ???           X       X      CCC           G                                                                   ',
    '                  G     X       X           XXXXXXXX      ???                                                           ',
    '                       X       X          XX        XX            XXXXX                                                 ',
    '      C      G         X       X          XX        XX    G      X    X       C   C                    C         F      ',
    '##########################p################################p###################p####p################################## ',
    '                                                                                                                        ',
    '                                                                                                                        ',
], 'Green Hills', '#6b95ea', '#4CAF50', '#C84C09');

// ===================== LEVEL 1-2: Underground (darker, compact) =====================
const level1_2 = parseLevel([
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'X                                                                                                                        X',
    'X       C   ?               XXXXXX                                                                                       X',
    'X              G                  C     C                                                                                X',
    'X    ???         XXXXXXXXX          XX  XX                                                                               X',
    'X                                                                                                                   F    X',
    'X                   G                       G      G            G                                                        X',
    'X   XXXXXXXXXXXXXX     XXXXXXXXX    XXXXXXXXXXXXXXXXXXXXXXXXXXXX                                                         X',
    'XM                                                                                                                       X',
    'Xp##########p######################p#####################################p##################################             X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
], 'Underground', '#1a0a2e', '#444444', '#8B6914');

// ===================== LEVEL 1-3: Sky World (floating platforms) =====================
const level1_3 = parseLevel([
    '                                                                                                                        ',
    '            C C C                                                                                                       ',
    '           ???????                                                                                                      ',
    '                                   C   C                                                                                ',
    '                                 XX  XX                                                                                 ',
    '                  ?                   ????                                                                              ',
    '                XXXXXX          G                                                                                       ',
    '                                   XXXXXXXXX      C                                                                     ',
    '      C   C                  XXXXXXXXXXXX              XXXXXXXXXXXXXXXXX                                                ',
    '   ????????         XXXXXXXXXXXXXX       XXXXXXXXXXXXXX                                                     F           ',
    '##########p######################################################p######################################################',
    '                                                                                                                        ',
    '                                                                                                                        ',
    '                                                                                                                        ',
], 'Sky World', '#87CEEB', '#90EE90', '#FF6347');

// ===================== LEVEL 1-4: Dark Castle (final, hardest) =====================
const level1_4 = parseLevel([
    'X                                                                                                  X',
    'X                                                                                                  X',
    'X              C C C                         C C C                                                  X',
    'X             ?????                         ?????                                   C               X',
    'X                                                                                 XXX              X',
    'X                         XXX                 G          XXX                                        X',
    'X                 G                         XXXXX                         G                           X',
    'X            XXXX             XXXX                              XXXX             XXXX               X',
    'X M     G             C  C          G      ? ? ?      G                C C                    F     X',
    'X####p##########p##########p############p##########p############p############p#####################X',
    'X####P##########P##########P############P##########P############P############P#####################X',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
], 'Dark Castle', '#2d1b69', '#8B0000', '#4a4a4a');

const levels = [level1_1, level1_2, level1_3, level1_4];

// Parallax decorations (clouds and bushes) per level
function getDecorations(levelIndex) {
    const clouds = [];
    const bushes = [];

    switch(levelIndex) {
        case 0: // Green Hills - pleasant clouds & bushes
            for (let i = 0; i < 20; i++) {
                clouds.push({ x: i * 350 + Math.random() * 100, y: 30 + Math.random() * 60 });
            }
            for (let i = 0; i < 14; i++) {
                bushes.push({ x: i * 450 + Math.random() * 100, scale: 0.7 + Math.random() * 0.5 });
            }
            break;

        case 1: // Underground - nothing (it's underground!)
            break;

        case 2: // Sky World - lots of clouds everywhere
            for (let i = 0; i < 25; i++) {
                clouds.push({ x: i * 250 + Math.random() * 80, y: 20 + Math.random() * 100 });
            }
            break;

        case 3: // Dark Castle - sparse ominous clouds
            for (let i = 0; i < 8; i++) {
                clouds.push({ x: i * 550 + Math.random() * 200, y: 15 + Math.random() * 40 });
            }
            break;
    }

    return { clouds, bushes };
}

export { levels, getDecorations };
