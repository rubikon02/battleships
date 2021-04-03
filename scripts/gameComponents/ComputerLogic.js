import { ShotResult, Direction } from './constants.js'


export default class ComputerLogic {
    constructor(board) {
        this.guesser = new RandomGuesser(board, (stage) => this.guesser = stage)
    }

    nextShot() {
        this.guesser.nextShot()
    }
}

class Guesser {
    constructor(board, nextStage) {
        this.board = board
        this.nextStage = nextStage
    }

    tooCloseToSunkShip(x, y) {
        for (const a of this.board.allTilesAround(x, y))
            if (this.board.getTile(a.x, a.y).isSunk())
                return true
        return false
    }

    isTileShot(x, y) {
        return this.board.getTile(x, y).isShot()
    }

    isTileHit(x, y) {
        return this.board.getTile(x, y).isHit()
    }

    fitsOnBoard(x, y) {
        return x >= 0 && y >= 0 && x < this.board.size && y < this.board.size
    }
}


class RandomGuesser extends Guesser {
    constructor(board, nextStage) {
        super(board, nextStage)
    }

    nextShot() {
        let x, y
        do {
            x = Math.floor(Math.random() * this.board.size)
            y = Math.floor(Math.random() * this.board.size)
        } while (this.tooCloseToSunkShip(x, y) || this.isTileShot(x, y))
        return this.fire(x, y)
    }

    fire(x, y) {
        const result = this.board.fire(x, y)
        if (result == ShotResult.HIT)
            this.nextStage(new DirectionGuesser(this.board, this.nextStage, x, y))
        return result
    }
}

class DirectionGuesser extends Guesser {
    constructor(board, nextStage, x, y) {
        super(board, nextStage)
        this.x = x
        this.y = y
        this.generator = this.shots(x, y)
        let rnd = Math.floor(Math.random() * 4)
        for (let i = 0; i < rnd; i++)
            this.generator.next()
    }

    shots = function* (x, y) {
        while (true) {
            this.directionIfCorrect = Direction.HORIZONTAL
            yield { x: x - 1, y: y }
            this.directionIfCorrect = Direction.VERTICAL
            yield { x: x, y: y - 1 }
            this.directionIfCorrect = Direction.HORIZONTAL
            yield { x: x + 1, y: y }
            this.directionIfCorrect = Direction.VERTICAL
            yield { x: x, y: y + 1 }
        }
    }

    nextShot() {
        const { x, y } = this.generator.next().value
        if (!this.fitsOnBoard(x, y) || this.isTileShot(x, y) || this.tooCloseToSunkShip(x, y))
            return this.nextShot()
        else
            return this.fire(x, y)

    }

    fire(x, y) {
        const result = this.board.fire(x, y)
        if (result == ShotResult.SUNK)
            this.nextStage(new RandomGuesser(this.board, this.nextStage))
        else if (result == ShotResult.HIT) {
            if (this.directionIfCorrect == Direction.HORIZONTAL)
                this.nextStage(new HorizontalGuesser(this.board, this.nextStage, this.x, this.y))
            else
                this.nextStage(new VerticalGuesser(this.board, this.nextStage, this.x, this.y))
        }
        return result
    }
}

class ShipGuesser extends Guesser {
    constructor(board, nextStage, x, y) {
        super(board, nextStage)
        this.x = x
        this.y = y
    }

    nextShot() {
        const { x, y } = this.generator.next().value
        if (this.isTileShot(x, y) || this.tooCloseToSunkShip(x, y))
            return this.nextShot()
        else
            return this.fire(x, y)
    }

    fire(x, y) {
        const result = this.board.fire(x, y)
        if (result == ShotResult.SUNK)
            this.nextStage(new RandomGuesser(this.board, this.nextStage))
        return result
    }
}

class HorizontalGuesser extends ShipGuesser {
    constructor(board, nextStage, x, y) {
        super(board, nextStage, x, y)
        this.generator = this.shots(x, y)
    }

    shots = function* (x, y) {
        let x2 = x
        while (x2 < this.board.size - 1 && this.isTileHit(x2, y))
            yield { x: ++x2, y: y }
        x2 = x
        while (x2 > 0 && this.isTileHit(x2, y))
            yield { x: --x2, y: y }
    }
}

class VerticalGuesser extends ShipGuesser {
    constructor(board, nextStage, x, y) {
        super(board, nextStage, x, y)
        this.generator = this.shots(x, y)
    }

    shots = function* (x, y) {
        let y2 = y
        while (y2 < this.board.size - 1 && this.isTileHit(x, y2))
            yield { x: x, y: ++y2 }
        y2 = y
        while (y2 > 0 && this.isTileHit(x, y2))
            yield { x: x, y: --y2 }
    }
}