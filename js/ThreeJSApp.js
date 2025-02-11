import * as THREE from "../modules/three.module.js";
import { OrbitControls } from '../modules/OrbitControls.js';
//import { ZoomPanController } from './ZoomPanController.js';
import { DragObj, generatePattern } from './pattern.js';

var controls = null;

// Global body meshes and materials
const bodyMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xffffff }), // White color
    new THREE.MeshBasicMaterial({ color: 0xffffff }), // White color
    new THREE.MeshBasicMaterial({ color: 0xffffff })  // White color
];

const bodyMeshes = [];
const bodySizes = [0.02, 0.04, 0.06]; // Different sizes for each body
const bodyposition = [new THREE.Vector3(0.5, 0.1, 0), new THREE.Vector3(0.3,0.1, 0), new THREE.Vector3(0.1, 0.1, 0)];

// Create DragObj instances for E, S, and V
var S = new DragObj(bodySizes[0], bodyposition[0]);
var V = new DragObj(bodySizes[1], bodyposition[1]);
var E = new DragObj(bodySizes[2], bodyposition[2]);

var splineMesh = null;

const bodyGeometryS = new THREE.SphereGeometry(bodySizes[0], 32, 32);
const bodyMeshS = new THREE.Mesh(bodyGeometryS, bodyMaterials[0]);
bodyMeshS.position.set(bodyposition[0].x, bodyposition[0].y, bodyposition[0].z);
bodyMeshS.userData.originalColor = bodyMaterials[0].color.getHex();
bodyMeshS.name = `S`; // Assign a name to the mesh
bodyMeshes.push(bodyMeshS);

const bodyGeometryV = new THREE.SphereGeometry(bodySizes[1], 32, 32);
const bodyMeshV = new THREE.Mesh(bodyGeometryV, bodyMaterials[1]);
bodyMeshV.position.set(bodyposition[1].x, bodyposition[1].y, bodyposition[1].z);
bodyMeshV.userData.originalColor = bodyMaterials[1].color.getHex();
bodyMeshV.name = `V`; // Assign a name to the mesh
bodyMeshes.push(bodyMeshV);

const bodyGeometryE = new THREE.SphereGeometry(bodySizes[2], 32, 32);
const bodyMeshE = new THREE.Mesh(bodyGeometryE, bodyMaterials[2]);
bodyMeshE.position.set(bodyposition[2].x, bodyposition[2].y, bodyposition[2].z);
bodyMeshE.userData.originalColor = bodyMaterials[2].color.getHex();
bodyMeshE.name = `E`; // Assign a name to the mesh
bodyMeshes.push(bodyMeshE);

export class ThreeJSApp {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        ///////// camera //////////
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
        //
        ///////// renderer //////////
        this.renderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // exposure level
        this.renderer.toneMappingExposure = 0.2;
        // color gradient
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // turn on the physically correct lighting model
        this.renderer.physicallyCorrectLights = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredBody = null;
        this.clickedBody = null;
        this.draggingBody = null;
        this.previousMousePosition = new THREE.Vector2();
        //this.zoomPanController = new ZoomPanController(this.camera, this.renderer.domElement);
        this.patternMesh = null;
        this.ratio = [0.4, 0.5]; // Initialize ratio
        this.keys = {}; // Initialize key state object


        ///////// controls //////////
        controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enablePan = false;
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.minDistance = 1; // how close camera can zoom/dolly in (default = 1)
        controls.maxDistance = 4000; // (default = infinity)
        controls.enableDamping = false; // enable inertia (default = false)
        controls.dampingFactor = 0.01; // lower = less responsive
        controls.autoRotateSpeed = 2.0; // how fast to rotate around target (default = 2)
        controls.zoomSpeed = 0.7; // speed of the zoom/dollying (default = 1)

        // Set the right mouse button for orbiting
        controls.mouseButtons = {
            //LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };


        // Add event listeners for keydown and keyup
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        
    }

    init() {
        // Add the global body meshes to the scene
        bodyMeshes.forEach(body => this.scene.add(body));

        // Add mouse move event listener
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.updatePattern();
        this.updateControlsTarget(E.position);

        this.animate();
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height; // Update aspect ratio for PerspectiveCamera
        this.camera.updateProjectionMatrix();
    }

    onKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
    }

    onKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        // Update the raycaster with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
    
        // Get the list of objects the ray intersects
        const intersects = this.raycaster.intersectObjects(bodyMeshes);
    
        // Reset all bodies to their original color
        bodyMeshes.forEach(body => {
            if (body !== this.clickedBody && body !== this.draggingBody) {
                body.material.color.set(body.userData.originalColor);
            }
        });
    
        // Check if the ray intersects any body
        if (intersects.length > 0) {
            const hoveredBody = intersects[0].object;
            if (hoveredBody !== this.clickedBody && hoveredBody !== this.draggingBody) {
                hoveredBody.material.color.set(0x00ff00); // Change color to green on hover
                this.hoveredBody = hoveredBody;
            }
        } else {
            this.hoveredBody = null;
        }
    
        // Handle dragging
        if (this.draggingBody) {
            // Create a plane at the Z position of the draggingBody
            const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -this.draggingBody.position.z);
    
            // Find the intersection of the ray with the plane
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(planeZ, intersection);
    
           
    
            // Log the dragging body's name and position
            console.log('Dragging Body name:', this.draggingBody.name);
            console.log('Dragging Body position:', this.draggingBody.position);
    
            // Update the corresponding DragObj instance
            if (this.draggingBody.name === 'S') {
                S.position = this.draggingBody.position; 
                 // Update the draggingBody's position (X and Y only)
                this.draggingBody.position.x = intersection.x;
                this.draggingBody.position.y = intersection.y;
            } else if (this.draggingBody.name === 'V') {
                V.position = this.draggingBody.position;
                 // Update the draggingBody's position (X and Y only)
                this.draggingBody.position.x = intersection.x;
                this.draggingBody.position.y = intersection.y;
            } else if (this.draggingBody.name === 'E') {
                //E.position = this.draggingBody.position;
                //this.updateControlsTarget(E.position);
            }
    
            // Update the pattern
            this.updatePattern();
        }
    }

    onMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            // Calculate mouse position in normalized device coordinates
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the raycaster with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Get the list of objects the ray intersects
            const intersects = this.raycaster.intersectObjects(bodyMeshes);

            // Check if the ray intersects any body
            if (intersects.length > 0) {
                const clickedBody = intersects[0].object;
                clickedBody.material.color.set(0xFFFF00); // Change color to yellow on click
                this.clickedBody = clickedBody;
                this.draggingBody = clickedBody;

                // Log the clicked body
                console.log('Clicked Body:', clickedBody);
            }
        }
    }

    onMouseUp(event) {
        if (event.button === 0 && this.clickedBody) { // Left mouse button
            this.clickedBody.material.color.set(this.clickedBody.userData.originalColor); // Restore original color on mouse up
            this.clickedBody = null;
            this.draggingBody = null;
        }
    }

    updatePattern() {
        // Remove the previous pattern mesh if it exists
        if (this.patternMesh) {
            if (this.patternMesh.pointsMesh) {
                this.scene.remove(this.patternMesh.pointsMesh);
                this.patternMesh.pointsMesh.geometry.dispose();
                this.patternMesh.pointsMesh.material.dispose();
            }
            if (this.patternMesh.linesMesh) {
                this.scene.remove(this.patternMesh.linesMesh);
                this.patternMesh.linesMesh.geometry.dispose();
                this.patternMesh.linesMesh.material.dispose();
            }
        }
    
        // Remove the previous spline mesh if it exists
        const object1 = this.scene.getObjectByName('spline');
        if (object1) {
            this.scene.remove(object1);
            object1.geometry.dispose();
            object1.material.dispose();
        }
    
        const object2 = this.scene.getObjectByName('lineGroup');
        if (object2) {
            this.scene.remove(object2);
            object2.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        }
    
        // Generate the new pattern
        const pattern = generatePattern(E, S, V, this.ratio);
        this.patternMesh = pattern;
    
        var group = new THREE.Group();
        group.name = 'lineGroup';
    
        // Create a spline from pointArray
        var curve = new THREE.CatmullRomCurve3(pattern.simplifiedPoints, false, 'catmullrom', 0.5);
        var splineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
        var splineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var splineMesh = new THREE.Line(splineGeometry, splineMaterial);
        splineMesh.name = 'spline';
    
        // Create a single geometry for all lines
        var linesGeometry = new THREE.BufferGeometry();
        var positions = [];
        var colors = [];
    
        for (const l of pattern.lineArray) {
            positions.push(...l[0].toArray(), ...l[1].toArray());
            colors.push(0, 0, 1, 0, 0, 1); // Blue color for lines
        }
    
        linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        linesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        var linesMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 50 });
        var linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
        linesMesh.name = 'lines';
    
        // Add the new pattern mesh to the scene
        group.add(linesMesh);
        group.add(splineMesh);
        this.scene.add(group);
    }
    

    updateControlsTarget(position) {
        controls.target.copy(position);
        controls.update();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update camera position based on key presses
        if (this.keys['w']) {
            this.camera.position.y += 0.1;
        }
        if (this.keys['s']) {
            this.camera.position.y -= 0.1;
        }
        if (this.keys['a']) {
            this.camera.position.x -= 0.1;
        }
        if (this.keys['d']) {
            this.camera.position.x += 0.1;
        }

        // Arrow key movement (forward, backward, left, right)
        if (this.keys['arrowup']) {
            this.camera.position.z -= 0.1; // Move forward
        }
        if (this.keys['arrowdown']) {
            this.camera.position.z += 0.1; // Move backward
        }
        if (this.keys['arrowleft']) {
            this.camera.position.x -= 0.1; // Move left
        }
        if (this.keys['arrowright']) {
            this.camera.position.x += 0.1; // Move right
        }

        //this.zoomPanController.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default ThreeJSApp;