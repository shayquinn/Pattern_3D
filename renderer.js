
import ThreeJSApp from './js/ThreeJSApp.js';

window.addEventListener('DOMContentLoaded', (event) => {
    const app = new ThreeJSApp(document.getElementById('threejs-container'));
    app.init();
});