import Ship from './Ship.js'
import { PlacingBoard, BoardShip } from './Board.js'
import Popup from './Popup.js'
import './ShipsMenu.js'
import createBoardUI from './BoardUI.js'
import ComputerLogic from './ComputerLogic.js'
import { SHIP_SIZES_CONFIGS, ShotResult } from './constants.js'
const COMPUTER_DELAY = 1000

export default function startGame(newGameSize = 10) {
    const game = document.createElement("game-container")
    game.boardSize = newGameSize
    game.shipSizes = SHIP_SIZES_CONFIGS[newGameSize].shipSizes
    document.body.prepend(game)
    return game
}

class Game extends HTMLElement {
    constructor() {
        super()
        this.gameEnd = null
        this.computer = null
        this.boardSize = null
        this.shipSizes = null
    }

    connectedCallback() {
        this.createContainers()
        this.createButtons()
        this.createSelect()
        this.currentStage = new PlacingStage(this)
        this.currentStage.nextStage = (stage) => this.currentStage = stage
    }

    createPopup(winner, shipsNotHit) {
        this.popup = new Popup(this, winner, shipsNotHit)
        this.prepend(this.popup)
        this.popup.addEventListener("restart", () => this.restart())
    }

    createContainers() {
        this.centerRow = document.createElement("div")
        this.centerRow.id = "centerRow"

        this.topRow = document.createElement("div")
        this.topRow.id = "topRow"

        this.boardsContainer = document.createElement("div")
        this.boardsContainer.id = "boardsContainer"

        this.append(this.topRow)
        this.append(this.centerRow)
        this.centerRow.append(this.boardsContainer)
    }

    createButtons() {
        this.startButton = document.createElement("button")
        this.startButton.id = "startButton"
        this.startButton.setAttribute("disabled", true)
        this.startButton.innerText = "Start Game"

        this.buttonsContainer = document.createElement("div")
        this.buttonsContainer.id = "buttonsContainer"
        this.buttonsContainer.append(this.startButton)
        this.topRow.append(this.buttonsContainer)
    }

    createSelect() {
        this.selectSize = document.createElement("select")
        for (let i = 2; i <= 10; i++) {
            const option = document.createElement('option')
            option.value = i
            option.innerHTML = i
            this.selectSize.appendChild(option)
        }
        this.selectSize.value = this.boardSize
        this.selectSize.addEventListener("change", () => this.restart(this.selectSize.value))
        this.buttonsContainer.append(this.selectSize)
    }

    restart(newGameSize = this.boardSize) {
        this.remove()
        startGame(parseInt(newGameSize))
    }
}

customElements.define("game-container", Game)

class PlacingStage {
    constructor(game) {
        this.game = game
        this.createShipsMenu()
        this.createPlayerBoard()
        this.createComputerBoard()
        this.createStartButton()
        this.createRestartButton()
        this.createPlaceRandomButton()
    }
    createShipsMenu() {
        this.shipsMenu = document.createElement('ships-menu')
        for (const size of this.game.shipSizes)
            this.shipsMenu.addShip(new Ship(size))
        this.game.centerRow.prepend(this.shipsMenu)
        this.shipsMenu.addEventListener("shipselected", () => {
            this.playerBoardUI.heldShip = new BoardShip(this.shipsMenu.getSelectedShip())
        })
    }

    createPlayerBoard() {
        this.playerBoardUI = createBoardUI(new PlacingBoard(this.game.boardSize))
        this.playerBoardUI.heldShip = new BoardShip(this.shipsMenu.getSelectedShip())
        this.game.boardsContainer.append(this.playerBoardUI)
        this.playerBoardUI.addEventListener('shipplaced', () => {
            this.shipsMenu.popSelectedShip()
            if (this.shipsMenu.allShipsPlaced())
                this.startButton.removeAttribute("disabled")
        })
    }

    createComputerBoard() {
        const computerBoard = new PlacingBoard(this.game.boardSize)
        computerBoard.placeShipsRandom()
        this.computerBoardUI = createBoardUI(computerBoard)
        this.game.boardsContainer.append(this.computerBoardUI)
    }

    createStartButton() {
        this.startButton = document.getElementById('startButton')
        this.startButton.addEventListener("click", () => {
            this.placeRandomButton.setAttribute("disabled", true)
            this.finishStage()
        })
    }

    createRestartButton() {
        this.restartButton = document.createElement("button")
        this.restartButton.id = "restartButton"
        this.restartButton.innerText = "Restart Game"
        this.game.buttonsContainer.append(this.restartButton)
        this.restartButton.addEventListener("click", () => this.game.restart())
    }

    createPlaceRandomButton() {
        this.placeRandomButton = document.createElement("button")
        this.placeRandomButton.id = "placeRandomButton"
        this.placeRandomButton.innerText = "Random"
        this.game.buttonsContainer.prepend(this.placeRandomButton)
        this.placeRandomButton.addEventListener("click", () => this.randomizePlayerShips())
    }

    randomizePlayerShips() {
        this.playerBoardUI.hideShips()
        this.playerBoardUI.board.clear()
        this.playerBoardUI.board.placeShipsRandom()
        this.playerBoardUI.revealShips()
        this.shipsMenu.remove()
        this.startButton.removeAttribute("disabled")
        this.playerBoardUI.heldShip = null
    }

    disableStartButton() {
        this.startButton.setAttribute("disabled", true)
        this.startButton.innerText = "Game started"
    }

    finishStage() {
        this.disableStartButton()
        let nextStage = new ShootingStage(
            this.game,
            this.playerBoardUI.finishPlacingShips(false),
            this.computerBoardUI.finishPlacingShips(true)
        )
        nextStage.nextStage = this.nextStage
        this.nextStage(nextStage)
    }
}

class ShootingStage {
    constructor(game, playerBoardUI, computerBoardUI) {
        this.game = game
        this.playerBoardUI = playerBoardUI
        this.computerBoardUI = computerBoardUI
        this.initHtml()
        this.addListeners()
        this.game.computer = new ComputerLogic(this.playerBoardUI.board)
    }

    initHtml() {
        this.playerBoardUI.id = "playerBoard"
        this.computerBoardUI.id = "computerBoard"
        this.computerBoardUI.allowAction()
    }

    addListeners() {
        this.playerBoardUI.addEventListener('shot', (e) => this.computerShot(e.detail))
        this.computerBoardUI.addEventListener('shot', (e) => this.playerShot(e.detail))
        this.playerBoardUI.addEventListener('gameend', () => this.finishStage("Computer"))
        this.computerBoardUI.addEventListener('gameend', () => this.finishStage("Player"))
    }

    playerShot(result) {
        if (result == ShotResult.HIT || result == ShotResult.SUNK)
            this.letPlayerShoot()
        else
            this.letComputerShoot(result)
    }

    computerShot(result) {
        if (result == ShotResult.HIT || result == ShotResult.SUNK)
            this.letComputerShoot(result)
        else
            this.letPlayerShoot()
    }

    letComputerShoot(result) {
        setTimeout(() => {
            if (this.stageFinished) return
            this.game.computer.nextShot(result)
        }, COMPUTER_DELAY)
    }

    letPlayerShoot() {
        this.computerBoardUI.allowAction()
    }

    finishStage(winner) {
        this.stageFinished = true
        const computerShipsNotHit = this.computerBoardUI.endGame()
        const playerShipsNotHit = this.playerBoardUI.endGame()
        setTimeout(() => {
            this.computerBoardUI.revealShips()
        }, 1000)
        setTimeout(() => {
            this.game.createPopup(winner, winner == "Computer" ? computerShipsNotHit : playerShipsNotHit)
        }, 1500)
    }
}