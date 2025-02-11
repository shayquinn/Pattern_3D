export class ZoomPanController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));

        this.isPanning = false;
        this.previousMousePosition = { x: 0, y: 0 };
    }

    onMouseWheel(event) {
        const delta = event.deltaY > 0 ? 1 : -1;
        this.camera.position.z += delta;
    }

    onMouseDown(event) {
        if (event.button === 2) { // Right mouse button
            this.isPanning = true;
            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    onMouseMove(event) {
        if (this.isPanning) {
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;

            this.camera.position.x -= deltaX * 0.01;
            this.camera.position.y += deltaY * 0.01;

            this.previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    }

    onMouseUp(event) {
        if (event.button === 2) { // Right mouse button
            this.isPanning = false;
        }
    }

    update() {
        // Update logic for the controller if needed
    }
}


