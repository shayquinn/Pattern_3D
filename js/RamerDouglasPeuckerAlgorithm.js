export class RamerDouglasPeuckerAlgorithm {
    static perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;

        const mag = Math.sqrt(dx * dx + dy * dy);
        let distance;

        if (mag > 0.0) {
            distance = ((point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx) / mag;
        } else {
            distance = 0.0;
        }

        return Math.abs(distance);
    }


    

    static ramerDouglasPeucker(points, epsilon, out) {
        if (points.length < 2) {
            throw new Error("Not enough points to simplify");
        }

        // Find the point with the maximum distance
        let dmax = 0;
        let index = 0;
        const end = points.length - 1;

        for (let i = 1; i < end; i++) {
            const d = RamerDouglasPeuckerAlgorithm.perpendicularDistance(points[i], points[0], points[end]);
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }

        // If max distance is greater than epsilon, recursively simplify
        if (dmax > epsilon) {
            // Recursive call
            const recResults1 = [];
            const recResults2 = [];

            RamerDouglasPeuckerAlgorithm.ramerDouglasPeucker(points.slice(0, index + 1), epsilon, recResults1);
            RamerDouglasPeuckerAlgorithm.ramerDouglasPeucker(points.slice(index), epsilon, recResults2);

            // Build the result list
            out.push(...recResults1.slice(0, -1));
            out.push(...recResults2);
        } else {
            // Just return start and end points
            out.push(points[0]);
            out.push(points[end]);
        }
    }
}

export default RamerDouglasPeuckerAlgorithm;