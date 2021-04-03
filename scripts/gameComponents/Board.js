import Ship from './Ship.js'
import { SHIP_SIZES_CONFIGS, Direction, TileState } from './constants.js'



class Tile {
    constructor(state = TileState.EMPTY, ship = null) {
        this.state = state
        this.ship = ship
    }
    isEmpty() {
        return this.state == TileState.EMPTY
    }
    isTaken() {
        const t = this.state
        return t == TileState.TAKEN || t == TileState.HIT || t == TileState.SUNK
    }
    isShot() {
        return this.state < 3
    }
    isHit() {
        return this.state < 2
    }
    isSunk() {
        return this.state == 1
    }

}

class Board {
    constructor(size, board) {
        this.size = size
        this.shipSizes = SHIP_SIZES_CONFIGS[this.size].shipSizes
        if (board === undefined)
            this.board = Array.from(Array(size), () => Array.from(Array(size), () => new Tile()))
        else
            this.board = board
        this.onTileChange = () => { }

    }
    setTileState(x, y, tileState) {
        this.board[x][y].state = tileState
        this.onTileChange(x, y, tileState)
    }

    setTileShip(x, y, ship) {
        this.board[x][y].ship = ship
    }

    getTile(x, y) {
        return this.board[x][y]
    }

    forAllTakenTiles(f) {
        for (const ship of this.ships)
            ship.forEachFragment((x, y) => {
                if (this.getTile(x, y).isTaken())
                    f(x, y)
            })
    }
}

export class BoardShip {
    constructor(ship, x = 0, y = 0, direction = Direction.HORIZONTAL) {
        this.ship = ship
        this.x = x
        this.y = y
        this.direction = direction
    }

    get width() {
        if (this.direction == Direction.HORIZONTAL)
            return this.ship.width
        else
            return this.ship.height
    }

    get height() {
        if (this.direction == Direction.HORIZONTAL)
            return this.ship.height
        else
            return this.ship.width
    }

    fragments = function* () {
        if (this.direction == Direction.HORIZONTAL)
            for (const a of this.ship.fragments())
                yield { x: a.x + this.x, y: a.y + this.y }
        else
            for (const a of this.ship.fragments())
                yield { x: this.x + a.y, y: this.y - a.x + this.ship.width - 1 }
    }

    moveFromWall(boardSize) {
        if (this.x + this.width > boardSize)
            this.x = boardSize - this.width
        if (this.y + this.height > boardSize)
            this.y = boardSize - this.height
    }

    forEachFragment(f) {
        for (const a of this.fragments())
            f(a.x, a.y)
    }

    areAllFragments(condition) {
        for (const a of this.fragments())
            if (!condition(a.x, a.y))
                return false
        return true
    }
}

export class PlacingBoard extends Board {
    constructor(size) {
        super(size)
        this.ships = []
    }

    finishPlacingShips() {
        return new FinishedBoard(this.size, this.board, this.ships)
    }

    isTileTaken(x, y) {
        return this.getTile(x, y).state == TileState.TAKEN
    }

    takeTile(x, y, ship) {
        this.setTileState(x, y, TileState.TAKEN)
        this.setTileShip(x, y, ship)
    }

    placeShip(ship) {
        ship.forEachFragment((x, y) => this.takeTile(x, y, ship))
        this.ships.push(ship)
    }

    canShipBePlaced(ship) {
        return ship.areAllFragments((x, y) => this.canShipFragmentBePlaced(x, y))
    }

    canShipFragmentBePlaced(x, y) {
        for (let col = x - 1; col <= x + 1; col++)
            for (let row = y - 1; row <= y + 1; row++)
                if (row >= 0 && col >= 0 && row < this.size && col < this.size)
                    if (this.isTileTaken(col, row))
                        return false
        return true
    }

    placeShipsRandom(shipSizes = this.shipSizes) {
        for (const shipSize of shipSizes) {
            let ship = new BoardShip(new Ship(shipSize))
            do {
                ship.direction = Math.round(Math.random()) ? Direction.HORIZONTAL : Direction.VERTICAL
                ship.x = Math.floor(Math.random() * (this.size - (ship.width - 1) * !ship.direction))
                ship.y = Math.floor(Math.random() * (this.size - (ship.height - 1) * ship.direction))
            } while (!this.canShipBePlaced(ship))
            this.placeShip(ship)
        }
    }

    clear() {
        this.forAllTakenTiles(() => this.board = Array.from(Array(this.size), () => Array.from(Array(this.size), () => new Tile())))
    }
}

export class FinishedBoard extends Board {
    constructor(size, board, ships) {
        super(size, board)
        this.ships = ships
        this.shipsHit = 0
        this.takenTileCount = 0
        this.forAllTakenTiles(() => this.takenTileCount++)
    }

    shipsNotHitCount() {
        return this.takenTileCount - this.shipsHit
    }

    fire(x, y) {
        const tileState = this.getTile(x, y).state
        if (tileState == TileState.TAKEN)
            this.sinkTile(x, y)
        else if (tileState == TileState.EMPTY)
            this.setTileState(x, y, TileState.MISSED)
        return this.getTile(x, y).state
    }

    sinkTile(x, y) {
        this.shipsHit++
        this.setTileState(x, y, TileState.HIT)
        this.trySinkShip(x, y)
    }

    trySinkShip(x, y) {
        if (this.areAllConnectedTilesDead(x, y))
            for (const tile of this.allConnectedTiles(x, y))
                this.setTileState(tile.x, tile.y, TileState.SUNK)
    }


    areAllConnectedTilesDead(x, y) {
        for (const tile of this.allConnectedTiles(x, y))
            if (!this.getTile(tile.x, tile.y).isShot())
                return false
        return true
    }

    allConnectedTiles = function* (x, y) {
        const ship = this.getTile(x, y).ship
        if (ship === null) return
        yield* ship.fragments()
    }

    allNeighbors = function* (x, y) {
        if (x > 0) yield { x: x - 1, y: y }
        if (x < this.size - 1) yield { x: x + 1, y: y }
        if (y > 0) yield { x: x, y: y - 1 }
        if (y < this.size - 1) yield { x: x, y: y + 1 }
    }

    allTilesAround = function* (x, y) {
        for (let x1 = x - 1; x1 <= x + 1; x1++)
            for (let y1 = y - 1; y1 <= y + 1; y1++)
                if (x1 >= 0 && y1 >= 0 && x1 < this.size && y1 < this.size)
                    yield { x: x1, y: y1 }
    }
}