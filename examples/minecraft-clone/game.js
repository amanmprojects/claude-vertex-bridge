import * as THREE from 'three';

// Block types with colors
const BLOCK_TYPES = {
    grass: { color: 0x4a8f29, name: 'Grass' },
    dirt: { color: 0x8b5a2b, name: 'Dirt' },
    stone: { color: 0x808080, name: 'Stone' },
    wood: { color: 0x8b4513, name: 'Wood' },
    sand: { color: 0xf4d03f, name: 'Sand' },
    water: { color: 0x3498db, name: 'Water', transparent: true }
};

// World settings
const WORLD_SIZE = 32;
const CHUNK_HEIGHT = 16;

// Game state
let scene, camera, renderer;
let blocks = new Map();
let selectedBlockType = 'grass';
let isPointerLocked = false;

// Player state
const player = {
    position: new THREE.Vector3(WORLD_SIZE / 2, 20, WORLD_SIZE / 2),
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    height: 1.8,
    speed: 0.15,
    jumpForce: 0.3,
    gravity: 0.015
};

// Input state
const keys = {};
const mouse = { x: 0, y: 0 };

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
raycaster.far = 8;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(player.position);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lighting
    setupLighting();

    // Generate world
    generateWorld();

    // Setup controls
    setupControls();

    // Setup block selector UI
    setupBlockSelector();

    // Start game loop
    animate();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b5a2b, 0.4);
    scene.add(hemiLight);
}

function generateWorld() {
    // Simple terrain generation using noise-like pattern
    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
            // Generate height using simple sine waves
            const height = Math.floor(
                8 +
                Math.sin(x * 0.1) * 3 +
                Math.cos(z * 0.1) * 3 +
                Math.sin((x + z) * 0.05) * 2
            );

            // Create column of blocks
            for (let y = 0; y <= height; y++) {
                let blockType;

                if (y === height) {
                    blockType = 'grass';
                } else if (y > height - 3) {
                    blockType = 'dirt';
                } else {
                    blockType = 'stone';
                }

                createBlock(x, y, z, blockType);
            }

            // Add some trees randomly
            if (Math.random() < 0.02 && height > 5) {
                createTree(x, height + 1, z);
            }
        }
    }
}

function createTree(x, y, z) {
    // Trunk
    for (let i = 0; i < 4; i++) {
        createBlock(x, y + i, z, 'wood');
    }

    // Leaves (simple cube shape)
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            for (let dy = 0; dy <= 2; dy++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
                createBlock(x + dx, y + 4 + dy, z + dz, 'grass');
            }
        }
    }
}

function createBlock(x, y, z, type) {
    const key = `${x},${y},${z}`;
    if (blocks.has(key)) return;

    const blockData = BLOCK_TYPES[type];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({
        color: blockData.color,
        transparent: blockData.transparent || false,
        opacity: blockData.transparent ? 0.7 : 1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { x, y, z, type };

    scene.add(mesh);
    blocks.set(key, mesh);
}

function removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const mesh = blocks.get(key);
    if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        blocks.delete(key);
    }
}

function setupControls() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;

        // Block selection with number keys
        const blockTypes = Object.keys(BLOCK_TYPES);
        const num = parseInt(e.key);
        if (num >= 1 && num <= blockTypes.length) {
            selectedBlockType = blockTypes[num - 1];
            updateBlockSelector();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Mouse events
    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            mouse.x += e.movementX * 0.002;
            mouse.y += e.movementY * 0.002;
            mouse.y = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, mouse.y));
        }
    });

    document.addEventListener('click', () => {
        if (!isPointerLocked) {
            renderer.domElement.requestPointerLock();
        } else {
            // Left click - break block
            breakBlock();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isPointerLocked) {
            // Right click - place block
            placeBlock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function setupBlockSelector() {
    const selector = document.getElementById('block-selector');
    selector.innerHTML = '';

    Object.entries(BLOCK_TYPES).forEach(([type, data], index) => {
        const slot = document.createElement('div');
        slot.className = 'block-slot';
        slot.style.backgroundColor = '#' + data.color.toString(16).padStart(6, '0');
        slot.textContent = `${index + 1}. ${data.name}`;
        slot.dataset.type = type;

        slot.addEventListener('click', () => {
            selectedBlockType = type;
            updateBlockSelector();
        });

        selector.appendChild(slot);
    });

    updateBlockSelector();
}

function updateBlockSelector() {
    const slots = document.querySelectorAll('.block-slot');
    slots.forEach(slot => {
        slot.classList.toggle('selected', slot.dataset.type === selectedBlockType);
    });
}

function breakBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const meshes = Array.from(blocks.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const { x, y, z } = hit.object.userData;
        removeBlock(x, y, z);
    }
}

function placeBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const meshes = Array.from(blocks.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const normal = hit.face.normal;
        const { x, y, z } = hit.object.userData;

        const newX = x + Math.round(normal.x);
        const newY = y + Math.round(normal.y);
        const newZ = z + Math.round(normal.z);

        // Don't place block where player is standing
        const playerBlockX = Math.floor(player.position.x);
        const playerBlockY = Math.floor(player.position.y);
        const playerBlockZ = Math.floor(player.position.z);

        if (newX === playerBlockX && newZ === playerBlockZ &&
            (newY === playerBlockY || newY === playerBlockY - 1)) {
            return;
        }

        createBlock(newX, newY, newZ, selectedBlockType);
    }
}

function updatePlayer() {
    // Calculate movement direction
    const forward = new THREE.Vector3(
        Math.sin(mouse.x),
        0,
        Math.cos(mouse.x)
    ).normalize();

    const right = new THREE.Vector3(
        Math.sin(mouse.x + Math.PI / 2),
        0,
        Math.cos(mouse.x + Math.PI / 2)
    ).normalize();

    // Apply input
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (keys['KeyW']) moveDir.add(forward);
    if (keys['KeyS']) moveDir.sub(forward);
    if (keys['KeyD']) moveDir.add(right);
    if (keys['KeyA']) moveDir.sub(right);

    if (moveDir.length() > 0) {
        moveDir.normalize().multiplyScalar(player.speed);
    }

    // Apply gravity
    player.velocity.y -= player.gravity;

    // Jump
    if (keys['Space'] && player.onGround) {
        player.velocity.y = player.jumpForce;
        player.onGround = false;
    }

    // Fly down (for creative mode feel)
    if (keys['ShiftLeft']) {
        player.velocity.y = -player.speed;
    }

    // Update position
    player.position.x += moveDir.x;
    player.position.z += moveDir.z;
    player.position.y += player.velocity.y;

    // Simple collision detection
    const playerBlockX = Math.floor(player.position.x);
    const playerBlockY = Math.floor(player.position.y);
    const playerBlockZ = Math.floor(player.position.z);

    // Check ground collision
    const groundKey = `${playerBlockX},${playerBlockY - 1},${playerBlockZ}`;
    if (blocks.has(groundKey) && player.velocity.y < 0) {
        player.position.y = playerBlockY;
        player.velocity.y = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }

    // Prevent falling through world
    if (player.position.y < 0) {
        player.position.y = 20;
        player.velocity.y = 0;
    }

    // Update camera
    camera.position.copy(player.position);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -mouse.x;
    camera.rotation.x = -mouse.y;
}

function animate() {
    requestAnimationFrame(animate);

    if (isPointerLocked) {
        updatePlayer();
    }

    renderer.render(scene, camera);
}

// Start the game
init();