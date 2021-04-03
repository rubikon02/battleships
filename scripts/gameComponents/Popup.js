export default class Popup extends HTMLElement {
    constructor(game, winner = "[winner]", shipsNotHit = "[shipsNotHitCount]") {
        super()
        this.game = game
        this.winner = winner
        this.shipsNotHit = shipsNotHit
        if (this.winner == "Player") this.loser = "Computer"
        if (this.winner == "Computer") this.loser = "Player"
        this.message = this.winner + ' won. ' + this.loser + ' had ' + this.shipsNotHit + ' more ship fragments to hit'
    }

    connectedCallback() {
        this.createPopup()
        this.addListeners()
    }

    createPopup() {
        let parser = new DOMParser()
        let popupString = '\
        <div id="gameEndPopup">\
            <div class="content">\
                <div class="text">\
                    <span>'+ this.message + '</span>\
                </div>\
                <div class="buttons">\
                    <button id="close">Close</button>\
                    <button id="restart">Play again</button>\
                </div>\
            </div>\
        </div>'
        let html = parser.parseFromString(popupString, 'text/html')
        this.prepend(html.body.firstChild);
    }

    addListeners() {
        this.closeButton = this.querySelector("#close")
        this.restartButton = this.querySelector("#restart")
        this.closeButton.addEventListener("click", () => this.remove())
        this.restartButton.addEventListener("click", () => this.dispatchEvent(new Event('restart')))
    }
}

customElements.define("pop-up", Popup)