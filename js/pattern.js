import * as THREE from "../modules/three.module.js";
import RamerDouglasPeuckerAlgorithm from './RamerDouglasPeuckerAlgorithm.js';

// DragObj class
export class DragObj {
    constructor(size, position, color) {
        this.size = size;
        this.position = position;
        this.color = color;
    }
}

// convertPoint method
function convertPoint(ang, x, y, cx, cy) {
    const rad = ang * Math.PI / 180;
    const cosAng = Math.cos(rad);
    const sinAng = Math.sin(rad);
    return new THREE.Vector3(
        cx + cosAng * (x - cx) - sinAng * (y - cy),
        cy + sinAng * (x - cx) + cosAng * (y - cy),
        0
    );
}//end 


function createArrays(E, S, V, ratio, maxIterations = 4001, tolerance = 0.0) {
    const ret = [[], []];
    const maxPoints = 100; // Maximum number of points to check for loop closure

    for (let i = 0; i < maxIterations; i++) {
        const angleSun = ratio[0] * i;
        const angleVenus = ratio[1] * i;

        // Sun's orbit around Earth
        const sunPosition = convertPoint(angleSun, S.position.x, S.position.y, E.position.x, E.position.y);
        ret[0].push(sunPosition);

        // Venus's orbit around Sun, then around Earth
        const venusRelativeToSun = convertPoint(angleVenus, V.position.x, V.position.y, S.position.x, S.position.y);
        const venusPosition = convertPoint(angleSun, venusRelativeToSun.x, venusRelativeToSun.y, E.position.x, E.position.y);
        ret[1].push(venusPosition);

        // Check if the Venus orbit has closed (i.e., the first and last points are approximately equal)
        if (i > maxPoints) {
            const firstPoint = ret[1][0];
            const lastPoint = ret[1][ret[1].length - 1];
            if (firstPoint.distanceTo(lastPoint) < tolerance) {
                break; // Exit the loop if the orbit has closed
            }
        }
    }

    return ret;
}
export function generatePattern(E, S, V, ratio) {
    const doubleArray = createArrays(E, S, V, ratio);
    const len = doubleArray[1].length - 1;

    // Clear existing pointArray and lineArray
    let pointArray = [];
    let lineArray = [];
    const lineSpace = 10; // Example value for lineSpace, adjust as needed

    // Add points to pointArray
    const epsilon = 0.01;
    let simplifiedPoints = [];

    
    for (let i = 0; i < len; i++) {
        const p = doubleArray[1][i].clone(); // Assuming the second point in each line is the one to add
        pointArray.push(p);
    }
    RamerDouglasPeuckerAlgorithm.ramerDouglasPeucker(pointArray, epsilon, simplifiedPoints);
    // Add lines to lineArray
    const num = lineSpace * (len / 100);
    for (let i = lineArray.length; i < len; i++) {
        if (i % 5 === 0) {
            const sp = doubleArray[0][i].clone(); // Start point
            const vp = doubleArray[1][i].clone(); // End point
            lineArray.push([sp, vp]);
        }
    }

    return { simplifiedPoints, lineArray };

}

