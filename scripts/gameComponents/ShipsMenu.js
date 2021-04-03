import { TILE_SIZE } from './constants.js'


export default class ShipsMenu extends HTMLElement {
    constructor() {
        super()
        this.selectedShip = null
    }

    addShip(ship) {
        const menuShip = document.createElement('menu-ship')
        menuShip.ship = ship
        if (this.childNodes.length == 0)
            this.selectShip(menuShip)
        this.append(menuShip)

        menuShip.addEventListener("click", () => {
            this.selectShip(menuShip)
            this.dispatchEvent(new Event('shipselected'))
        })
    }

    getSelectedShip() {
        return this.selectedShip.ship
    }

    popSelectedShip() {
        const ship = this.selectedShip.ship
        this.removeSelectedShip()
        return ship
    }

    isAnyShipSelected() {
        return this.selectedShip !== null
    }

    allShipsPlaced() {
        return this.childNodes.length == 0
    }

    selectShip(ship) {
        if (this.selectedShip !== null)
            this.selectedShip.deselect()
        this.selectedShip = ship;
        ship.select()
    }

    removeSelectedShip() {
        this.selectedShip.remove()
        this.selectedShip = null
    }
}

class MenuShip extends HTMLElement {
    constructor() {
        super()
        this.ship = undefined
    }

    connectedCallback() {
        this.style.height = TILE_SIZE * this.ship.height + "px"
        this.style.width = TILE_SIZE * this.ship.width + "px"
        for (const { x, y } of this.ship.fragments())
            this.createShipTile(x, y)
    }

    createShipTile(x, y) {
        const tile = document.createElement("ship-element")
        tile.style.left = TILE_SIZE * x + "px"
        tile.style.top = TILE_SIZE * y + "px"
        this.append(tile)
        return tile
    }

    select() {
        this.classList.add("selected")
    }

    deselect() {
        this.classList.remove("selected")
    }
}

customElements.define("menu-ship", MenuShip)
customElements.define("ships-menu", ShipsMenu)