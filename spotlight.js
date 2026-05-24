export default class Spotlight {

    constructor(position, direction, cutoff) {

        this.position = position;
        this.direction = direction;
        
        this.cutoff =
            Math.cos(
                glMatrix.toRadian(cutoff)
            );
    }

}