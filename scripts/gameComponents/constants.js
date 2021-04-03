export const TILE_SIZE = 30

export const Direction = {
    HORIZONTAL: 0,
    VERTICAL: 1,
}

export const TileState = {
    HIT: 0,
    SUNK: 1,
    MISSED: 2,
    EMPTY: 3,
    TAKEN: 4,
}

export const ShotResult = {
    HIT: 0,
    SUNK: 1,
    MISSED: 2,
}

export const SHIP_SIZES_CONFIGS = {
    2: { "shipSizes": [1] },
    3: { "shipSizes": [2] },
    4: { "shipSizes": [3, 1] },
    5: { "shipSizes": [4, 2] },
    6: { "shipSizes": [3, 2, 2, 1] },
    7: { "shipSizes": [3, 3, 2, 2, 1] },
    8: { "shipSizes": [3, 3, 2, 2, 2, 1] },
    9: { "shipSizes": [3, 3, 2, 2, 2, 1, 1, 1] },
    10: { "shipSizes": [4, 3, 3, 2, 2, 2, 1, 1, 1, 1] },
}