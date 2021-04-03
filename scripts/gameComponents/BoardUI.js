import { TILE_SIZE, TileState } from './constants.js'

export default function createBoardUI(board, revealed) {
    let placingBoardUI = document.createElement('placing-game-board')
    placingBoardUI.board = board
    placingBoardUI.revealed = revealed
    return placingBoardUI
}

function createFinishedBoardUI(board, revealed) {
    let finishedBoardUI = document.createElement('finished-game-board')
    finishedBoardUI.board = board
    finishedBoardUI.revealed = revealed
    return finishedBoardUI
}

class BoardUI extends HTMLElement {
    constructor() {
        super()
        this.board = null
    }

    getTileByLocation(x, y) {
        return this.childNodes[this.board.size * y + x]
    }

    getTileCoords(tile) {
        const x = parseInt(tile.style.left) / TILE_SIZE
        const y = parseInt(tile.style.top) / TILE_SIZE
        return { x, y }
    }

    connectedCallback() {
        this.classList.add("board")
        this.style.width = this.board.size * TILE_SIZE + "px"
        this.style.height = this.board.size * TILE_SIZE + "px"
        for (let y = 0; y < this.board.size; y++)
            for (let x = 0; x < this.board.size; x++)
                this.createTile(x, y)
        this.addListeners()
    }

    createTile(x, y) {
        const boardTile = document.createElement("board-tile")
        boardTile.style.left = x * TILE_SIZE + "px"
        boardTile.style.top = y * TILE_SIZE + "px"
        if (this.revealed && this.board.getTile(x, y).isTaken())
            boardTile.classList.add("revealedShip")
        this.append(boardTile)
    }

    revealShips() {
        this.board.forAllTakenTiles((x, y) => {
            this.getTileByLocation(x, y).classList.add("revealedShip")
        })
    }
    hideShips() {
        this.board.forAllTakenTiles((x, y) => {
            this.getTileByLocation(x, y).classList.remove("revealedShip")
        })
    }
}


class PlacingBoardUI extends BoardUI {
    constructor() {
        super()
        this.heldShip = null
    }

    finishPlacingShips(isInteractive) {
        let finishedBoardUI = createFinishedBoardUI(this.board.finishPlacingShips(), !isInteractive)
        this.parentNode.insertBefore(finishedBoardUI, this)
        this.remove()
        return finishedBoardUI
    }

    addListeners() {
        this.board.onTileChange = (x, y) => {
            this.getTileByLocation(x, y).classList.add("revealedShip")
        }

        this.addEventListener("contextmenu", (e) => {
            const { x, y } = this.getTileCoords(e.target)
            e.preventDefault()
            this.swapHeldShipDirection(x, y)
        })

        this.addEventListener("mouseover", (e) => {
            const { x, y } = this.getTileCoords(e.target)
            this.moveHeldShip(x, y)
        })

        this.addEventListener("mouseleave", () => {
            this.dehighlightShip()
        }, true)

        this.addEventListener("click", () => {
            if (this.canShipBePlaced())
                this.placeShip()
        })
    }


    moveHeldShip(x, y) {
        if (this.heldShip === null) return
        this.heldShip.x = x
        this.heldShip.y = y
        this.heldShip.moveFromWall(this.board.size)
        this.highlightShip()
    }

    swapHeldShipDirection(x, y) {
        if (this.heldShip === null) return
        this.dehighlightShip()
        this.heldShip.direction = !this.heldShip.direction
        this.moveHeldShip(x, y)
    }

    placeShip() {
        this.dehighlightShip()
        this.board.placeShip(this.heldShip)
        this.heldShip = null
        this.dispatchEvent(new Event('shipplaced'))
    }

    highlightShip() {
        const colorClass = this.canShipBePlaced() ? "highlightCorrect" : "highlightIncorrect"
        this.forEachShipTile(tile => {
            tile.classList.add(colorClass)
        })
    }

    dehighlightShip() {
        this.forEachShipTile(tile => {
            tile.classList.remove("highlightCorrect")
            tile.classList.remove("highlightIncorrect")
        })
    }

    canShipBePlaced() {
        if (this.heldShip === null) return false
        return this.board.canShipBePlaced(this.heldShip)
    }

    forEachShipTile(f) {
        if (this.heldShip === null) return
        this.heldShip.forEachFragment((x, y) => {
            f(this.getTileByLocation(x, y))
        })
    }
}


class FinishedBoardUI extends BoardUI {
    constructor() {
        super()
        this.board = null
        this.fireAllowed = false
        this.gameRunning = true
    }

    addListeners() {
        this.board.onTileChange = (x, y, tileState) => {
            let tile = this.getTileByLocation(x, y)
            if (tileState == TileState.HIT) {
                tile.classList.add("hit")
                this.dispatchEvent(new CustomEvent("shot", { detail: tileState }))
                if (this.board.shipsNotHitCount() == 0)
                    this.dispatchEvent(new Event("gameend"))
            }
            if (tileState == TileState.MISSED) {
                tile.classList.add("missed")
                this.dispatchEvent(new CustomEvent("shot", { detail: tileState }))
            }
            if (tileState == TileState.SUNK)
                tile.classList.add("sunk")
        }

        this.addEventListener("click", (e) => {
            if (e.target === this) return
            const { x, y } = this.getTileCoords(e.target)
            this.fire(x, y)
        })
    }

    endGame() {
        this.gameRunning = false
        this.classList.remove("fireAllowed")
        return this.board.shipsNotHitCount()
    }

    allowAction() {
        this.fireAllowed = true
        this.classList.add("fireAllowed")
    }

    getTileByLocation(x, y) {
        return this.childNodes[this.board.size * y + x]
    }

    hasBeenShot(x, y) {
        return this.board.getTile(x, y).isShot()
    }

    disallowAction() {
        this.fireAllowed = false
        this.classList.remove("fireAllowed")
    }

    fire(x, y) {
        if (!this.gameRunning || !this.fireAllowed || this.hasBeenShot(x, y)) return
        this.disallowAction()
        this.board.fire(x, y)
    }
}

customElements.define("placing-game-board", PlacingBoardUI)
customElements.define("finished-game-board", FinishedBoardUI)