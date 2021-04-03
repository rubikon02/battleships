export default class Ship {
    constructor(length) {
        this.length = parseInt(length)
    }
    fragments = function* () {
        for (let i = 0; i < this.length; i++)
            yield { x: i, y: 0 }
    }

    get width() {
        return this.length
    }

    get height() {
        return 1
    }
}