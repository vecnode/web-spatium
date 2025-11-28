// Three.js initialization
// This file is loaded after Three.js library

// =======================================
// WebGL and Three.js Graphics

// Example: Check if Three.js is loaded
if (typeof THREE !== 'undefined') {
    console.log('Three.js is loaded! Version:', THREE.REVISION);
    
    /*--------------------
    Canvas Dimensions
    --------------------*/
    const CANVAS_WIDTH = 720
    const CANVAS_HEIGHT = 512
    
    /*--------------------
    Renderer
    --------------------*/
    const renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('canvas'), 
        antialias: true
    })
    renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT )
    
    
    /*--------------------
    Camera & Scene
    --------------------*/
    const camera = new THREE.PerspectiveCamera( 75, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000 )
    camera.position.z = 5
    const scene = new THREE.Scene()
    scene.background = new THREE.Color( 0xe0e0e0 )
    // Fog removed for better visibility
    
    
    /*--------------------
    Controls
    --------------------*/
    const controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    
    
    /*--------------------
    Light
    --------------------*/
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const light2 = new THREE.PointLight(0xffffff, 1.0)
    light2.position.set(0, 1, 0)
    scene.add(light2)
    
    const light = new THREE.PointLight(0xffffff, 0.8)
    light.position.set(0, 2, 0)
    scene.add(light)
    light.castShadow = true
    light.shadow.mapSize.width = 4096
    light.shadow.mapSize.height = 4096
    light.shadow.camera.near = 0.1
    light.shadow.camera.far = 30
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    
    /*--------------------
    Pendulum Class
    --------------------*/
    class Pendulum {
        constructor(scene, matcapTexture, options = {}) {
            // Default options
            this.scene = scene;
            this.matcap = matcapTexture;
            this.ballRadius = options.ballRadius || 0.3;
            this.ballSegments = options.ballSegments || 32;
            this.lineRadius = options.lineRadius || 0.01;
            this.lineLength = options.lineLength || 8;
            this.lineSegments = options.lineSegments || 32;
            this.lineColor = options.lineColor || 0xcccccc;
            this.ballY = options.ballY || -6;
            this.lineY = options.lineY || -2;
            this.boxSize = options.boxSize || 0.5;
            
            // Create geometries and materials
            this.ballGeo = new THREE.SphereBufferGeometry(
                this.ballRadius, 
                this.ballSegments, 
                this.ballSegments
            );
            this.ballMat = new THREE.MeshMatcapMaterial({ 
                matcap: this.matcap
            });
            
            this.lineGeo = new THREE.CylinderBufferGeometry(
                this.lineRadius, 
                this.lineRadius, 
                this.lineLength, 
                this.lineSegments
            );
            this.lineMat = new THREE.MeshPhongMaterial({ 
                color: this.lineColor
            });
            
            // Create group
            this.group = new THREE.Group();
            
            // Create ball mesh
            this.ball = new THREE.Mesh(this.ballGeo, this.ballMat);
            this.ball.position.y = this.ballY;
            this.ball.castShadow = true;
            this.ball.receiveShadow = true;
            this.group.add(this.ball);
            
            // Create line/chain mesh
            this.line = new THREE.Mesh(this.lineGeo, this.lineMat);
            this.line.position.y = this.lineY;
            this.group.add(this.line);
            
            // Create wireframe box at the top of the pendulum
            // Top of line is at lineY + (lineLength/2) = -2 + 4 = 2 relative to group
            const boxGeo = new THREE.BoxGeometry(this.boxSize, this.boxSize, this.boxSize);
            const boxEdges = new THREE.EdgesGeometry(boxGeo);
            const boxMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            this.topBox = new THREE.LineSegments(boxEdges, boxMaterial);
            // Position at top of line: lineY + lineLength/2 = -2 + 4 = 2
            this.topBox.position.y = this.lineY + (this.lineLength / 2);
            this.group.add(this.topBox);
            
            // GSAP animation timeline (can be controlled)
            this.animationTimeline = null;
            
            // Add to scene
            this.scene.add(this.group);
        }
        
        /**
         * Set the position of the pendulum
         * @param {number} x - X position
         * @param {number} y - Y position
         * @param {number} z - Z position
         */
        setPosition(x, y, z) {
            this.group.position.set(x, y, z);
        }
        
        /**
         * Set the rotation of the pendulum
         * @param {number} x - X rotation
         * @param {number} y - Y rotation
         * @param {number} z - Z rotation
         */
        setRotation(x, y, z) {
            this.group.rotation.set(x, y, z);
        }
        
        /**
         * Start the pendulum swing animation
         * @param {Object} options - Animation options
         * @param {number} options.from - Starting rotation angle (default: -0.3)
         * @param {number} options.to - Ending rotation angle (default: 0.3)
         * @param {number} options.duration - Animation duration in seconds (default: 1.5)
         * @param {string} options.ease - GSAP easing function (default: 'power1.inOut')
         * @param {number} options.delay - Delay before starting animation (default: 0)
         * @param {boolean} options.repeat - Whether to repeat (default: true)
         */
        startAnimation(options = {}) {
            // Stop existing animation if any
            this.stopAnimation();
            
            const from = options.from !== undefined ? options.from : -0.3;
            const to = options.to !== undefined ? options.to : 0.3;
            const duration = options.duration !== undefined ? options.duration : 1.5;
            const ease = options.ease || 'power1.inOut';
            const delay = options.delay !== undefined ? options.delay : 0;
            const repeat = options.repeat !== undefined ? options.repeat : -1;
            
            this.animationTimeline = gsap.fromTo(this.group.rotation, {
                x: from,
            }, {
                duration: duration,
                x: to,
                repeat: repeat,
                ease: ease,
                yoyo: true,
                delay: delay
            });
        }
        
        /**
         * Stop the pendulum animation
         */
        stopAnimation() {
            if (this.animationTimeline) {
                this.animationTimeline.kill();
                this.animationTimeline = null;
            }
        }
        
        /**
         * Remove the pendulum from the scene
         */
        dispose() {
            this.stopAnimation();
            this.scene.remove(this.group);
            
            // Dispose geometries and materials
            this.ballGeo.dispose();
            this.ballMat.dispose();
            this.lineGeo.dispose();
            this.lineMat.dispose();
        }
        
        /**
         * Get the group object (for direct Three.js manipulation)
         * @returns {THREE.Group}
         */
        getGroup() {
            return this.group;
        }
        
        /**
         * Get the ball mesh
         * @returns {THREE.Mesh}
         */
        getBall() {
            return this.ball;
        }
        
        /**
         * Get the line/chain mesh
         * @returns {THREE.Mesh}
         */
        getLine() {
            return this.line;
        }
    }
    
    /*--------------------
    Init
    --------------------*/
    const meshes = []
    const matcap = new THREE.TextureLoader().load('https://raw.githubusercontent.com/nidorx/matcaps/master/1024/5C4E41_CCCDD6_9B979B_B1AFB0.png')
    const init = () => {
        // Create a single pendulum at the center
        const pendulum = new Pendulum(scene, matcap);
        pendulum.setPosition(0, 6, 0);
        pendulum.startAnimation();
        meshes.push(pendulum);
        
        const geoPlane = new THREE.PlaneBufferGeometry(100, 100)
        const mat3 = new THREE.MeshPhongMaterial( { 
        color: 0xffffff,
        shininess: 0.4,
        metalness: 0.2,
        })
        const plane = new THREE.Mesh(geoPlane, mat3)
        plane.rotation.x = -Math.PI / 2
        plane.position.y = -2
        plane.receiveShadow = true
        scene.add(plane)
        
        // Add grid helper to visualize the ground
        const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0xcccccc)
        gridHelper.position.y = -2
        scene.add(gridHelper)
    }
    init()
    
    
    /*--------------------
    Renderer
    --------------------*/
    const render = () => {
        requestAnimationFrame( render )
        renderer.render( scene, camera )
        controls.update()
    }
    render()
    
    
    /*--------------------
    Resize
    --------------------*/
    const resize = () => {
        const CANVAS_WIDTH = window.innerWidth / 2
        const CANVAS_HEIGHT = window.innerHeight / 2
        camera.aspect = CANVAS_WIDTH / CANVAS_HEIGHT
        camera.updateProjectionMatrix()
        renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT )
    }
    window.addEventListener('resize', resize)
    
    /*--------------------
    Camera Controls
    --------------------*/
    // Function to set camera to front view (facing along x-axis)
    function setCamera1() {
        // Position camera on the positive x-axis, looking at origin
        camera.position.set(5, 0, 0);
        camera.lookAt(0, 0, 0);
        // Update controls target to origin
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    // Make function globally available
    window.setCamera1 = setCamera1;
}

// =======================================
// Web Audio

// Create an AudioContext
let audioContext = new AudioContext();

// Create a (first-order Ambisonic) Resonance Audio scene and pass it
// the AudioContext.
let resonanceAudioScene = new ResonanceAudio(audioContext);
console.log("Resonance Audio scene created ", resonanceAudioScene);

// Send scene's rendered binaural output to stereo out.
resonanceAudioScene.output.connect(audioContext.destination);

// Define room dimensions.
// By default, room dimensions are undefined (0m x 0m x 0m).
let roomDimensions = {
    width: 3.1,
    height: 2.5,
    depth: 3.4,
};

// Define materials for each of the room's six surfaces.
// Room materials have different acoustic reflectivity.
let roomMaterials = {
    // Room wall materials
    left: 'brick-bare',
    right: 'curtain-heavy',
    front: 'marble',
    back: 'glass-thin',
    // Room floor
    down: 'grass',
    // Room ceiling
    up: 'transparent',
};

// Add the room definition to the scene.
resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);
// Create an AudioElement.
let audioElement = document.createElement('audio');

// Load an audio file into the AudioElement.
audioElement.src = 'static/assets/bird.wav';
audioElement.crossOrigin = 'anonymous';
audioElement.load();

// Generate a MediaElementSource from the AudioElement.
let audioElementSource = audioContext.createMediaElementSource(audioElement);

// Add the MediaElementSource to the scene as an audio input source.
let source = resonanceAudioScene.createSource();
audioElementSource.connect(source.input);
// Set the source position relative to the room center (source default position).
source.setPosition(-0.707, 0, -0.707);

// =======================================
// Spatialization Canvas Control
// =======================================

/**
 * Class for managing 2D visualization/interaction for spatial audio control.
 * Based on Resonance Audio examples.
 * @param {Object} canvas - Canvas element
 * @param {Array} elements - Array of element objects with x, y, radius, etc.
 * @param {Function} callbackFunc - Callback function to update audio positions
 */
function CanvasControl(canvas, elements, callbackFunc) {
    this._canvas = canvas;
    this._elements = elements;
    this._callbackFunc = callbackFunc;
    this._context = this._canvas.getContext('2d');
    this._cursorDown = false;
    this._selected = {
        index: -1,
        xOffset: 0,
        yOffset: 0,
    };
    this._lastMoveEventTime = 0;
    this._minimumThreshold = 16;
    
    let that = this;
    
    canvas.addEventListener('touchstart', function(event) {
        that._cursorDownFunc(event);
    });
    
    canvas.addEventListener('mousedown', function(event) {
        that._cursorDownFunc(event);
    });
    
    canvas.addEventListener('touchmove', function(event) {
        let currentEventTime = Date.now();
        if (currentEventTime - that._lastMoveEventTime > that._minimumThreshold) {
            that._lastMoveEventTime = currentEventTime;
            if (that._cursorMoveFunc(event)) {
                event.preventDefault();
            }
        }
    }, true);
    
    canvas.addEventListener('mousemove', function(event) {
        let currentEventTime = Date.now();
        if (currentEventTime - that._lastMoveEventTime > that._minimumThreshold) {
            that._lastMoveEventTime = currentEventTime;
            that._cursorMoveFunc(event);
        }
    });
    
    document.addEventListener('touchend', function(event) {
        that._cursorUpFunc(event);
    });
    
    document.addEventListener('mouseup', function(event) {
        that._cursorUpFunc(event);
    });
    
    window.addEventListener('resize', function(event) {
        that.resize();
        that.draw();
    }, false);
    
    this.invokeCallback();
    this.resize();
    this.draw();
}

CanvasControl.prototype.invokeCallback = function() {
    if (this._callbackFunc !== undefined) {
        this._callbackFunc(this._elements);
    }
};

CanvasControl.prototype.resize = function() {
    // Keep canvas at fixed 200x200 size
    this._canvas.width = 200;
    this._canvas.height = 200;
};

CanvasControl.prototype.draw = function() {
    this._context.globalAlpha = 1;
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    
    // Draw background
    this._context.fillStyle = '#f8fafc';
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    
    // Draw border
    this._context.lineWidth = 2;
    this._context.strokeStyle = '#e2e8f0';
    this._context.strokeRect(0, 0, this._canvas.width, this._canvas.height);
    
    // Draw grid lines
    this._context.strokeStyle = '#e2e8f0';
    this._context.lineWidth = 1;
    
    // Vertical center line
    this._context.beginPath();
    this._context.moveTo(this._canvas.width / 2, 0);
    this._context.lineTo(this._canvas.width / 2, this._canvas.height);
    this._context.stroke();
    
    // Horizontal center line
    this._context.beginPath();
    this._context.moveTo(0, this._canvas.height / 2);
    this._context.lineTo(this._canvas.width, this._canvas.height / 2);
    this._context.stroke();
    
    // Draw elements
    for (let i = 0; i < this._elements.length; i++) {
        let radiusInPixels = this._elements[i].radius * this._canvas.width;
        let x = this._elements[i].x * this._canvas.width;
        let y = this._elements[i].y * this._canvas.height;
        
        this._context.globalAlpha = this._elements[i].alpha;
        
        if (this._elements[i].type === 'listener') {
            // Draw listener (purple circle)
            this._context.fillStyle = '#9333ea';
            this._context.beginPath();
            this._context.arc(x, y, radiusInPixels, 0, Math.PI * 2);
            this._context.fill();
        } else if (this._elements[i].type === 'source') {
            // Draw source (black circle)
            this._context.fillStyle = '#000000';
            this._context.beginPath();
            this._context.arc(x, y, radiusInPixels, 0, Math.PI * 2);
            this._context.fill();
        }
    }
};

CanvasControl.prototype.getCursorPosition = function(event) {
    let cursorX;
    let cursorY;
    let rect = this._canvas.getBoundingClientRect();
    
    if (event.touches !== undefined) {
        cursorX = event.touches[0].clientX;
        cursorY = event.touches[0].clientY;
    } else {
        cursorX = event.clientX;
        cursorY = event.clientY;
    }
    
    return {
        x: cursorX - rect.left,
        y: cursorY - rect.top,
    };
};

CanvasControl.prototype.getNearestElement = function(cursorPosition) {
    let minDistance = 1e8;
    let minIndex = -1;
    let minXOffset = 0;
    let minYOffset = 0;
    
    for (let i = 0; i < this._elements.length; i++) {
        if (this._elements[i].clickable == true) {
            let dx = this._elements[i].x * this._canvas.width - cursorPosition.x;
            let dy = this._elements[i].y * this._canvas.height - cursorPosition.y;
            let distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance
            
            if (distance < minDistance &&
                distance < 2 * this._elements[i].radius * this._canvas.width) {
                minDistance = distance;
                minIndex = i;
                minXOffset = dx;
                minYOffset = dy;
            }
        }
    }
    
    return {
        index: minIndex,
        xOffset: minXOffset,
        yOffset: minYOffset,
    };
};

CanvasControl.prototype._cursorUpdateFunc = function(cursorPosition) {
    if (this._selected.index > -1) {
        this._elements[this._selected.index].x = Math.max(0, Math.min(1,
            (cursorPosition.x + this._selected.xOffset) / this._canvas.width));
        this._elements[this._selected.index].y = Math.max(0, Math.min(1,
            (cursorPosition.y + this._selected.yOffset) / this._canvas.height));
        
        this.invokeCallback();
    }
    this.draw();
};

CanvasControl.prototype._cursorDownFunc = function(event) {
    this._cursorDown = true;
    let cursorPosition = this.getCursorPosition(event);
    this._selected = this.getNearestElement(cursorPosition);
    this._cursorUpdateFunc(cursorPosition);
    document.body.style = 'overflow: hidden;';
};

CanvasControl.prototype._cursorUpFunc = function(event) {
    this._cursorDown = false;
    this._selected.index = -1;
    document.body.style = '';
};

CanvasControl.prototype._cursorMoveFunc = function(event) {
    let cursorPosition = this.getCursorPosition(event);
    let selection = this.getNearestElement(cursorPosition);
    
    if (this._cursorDown == true) {
        this._cursorUpdateFunc(cursorPosition);
    }
    
    if (selection.index > -1) {
        this._canvas.style.cursor = 'pointer';
        return true;
    } else {
        this._canvas.style.cursor = 'default';
        return false;
    }
};

// Room dimensions for position calculation
let dimensions = {
    width: roomDimensions.width,
    height: roomDimensions.height,
    depth: roomDimensions.depth,
};

/**
 * Update the audio source position based on canvas element positions.
 * @param {Array} elements - Array of element objects with normalized x, y coordinates
 */
function updatePositions(elements) {
    if (!source) return;
    
    for (let i = 0; i < elements.length; i++) {
        // Convert normalized coordinates (0-1) to audio position
        // Formula: (x - 0.5) * dimensions.width / 2 for X
        //          (y - 0.5) * dimensions.depth / 2 for Z
        let x = (elements[i].x - 0.5) * dimensions.width / 2;
        let y = 0; // Keep Y at 0 for 2D movement
        let z = (elements[i].y - 0.5) * dimensions.depth / 2;
        
        if (elements[i].type === 'source') {
            source.setPosition(x, y, z);
        }
    }
}

// Initialize canvas control when DOM is ready
let onSpatialCanvasLoad = function() {
    let spatialCanvas = document.getElementById('spatialCanvas');
    
    if (!spatialCanvas) {
        console.error('Spatial canvas not found');
        return;
    }
    
    let elements = [
        {
            type: 'source',
            x: 0.25,  // Initial position (normalized 0-1)
            y: 0.25,
            radius: 0.04,
            alpha: 0.75,
            clickable: true,
        },
        {
            type: 'listener',
            x: 0.5,   // Center position (normalized 0-1)
            y: 0.5,
            radius: 0.06,
            alpha: 0.75,
            clickable: false,
        },
    ];
    
    new CanvasControl(spatialCanvas, elements, updatePositions);
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onSpatialCanvasLoad);
} else {
    onSpatialCanvasLoad();
}

// Function to play the audio (can be called from a button)
function playAudio() {
    // Resume audio context if it's suspended (browsers require user interaction)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    audioElement.play().then(() => {
        console.log("Audio playing");
    }).catch(error => {
        console.error("Error playing audio:", error);
    });
}

// Make the function globally available
window.playAudio = playAudio;

