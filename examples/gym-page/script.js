// Game State
const gameState = {
    started: false,
    paused: false,
    inWorkout: false
};

// Player Stats
const player = {
    level: 1,
    xp: 0,
    maxXp: 100,
    strength: 10,
    endurance: 10,
    speed: 10,
    energy: 100,
    maxEnergy: 100
};

// Three.js Setup
let scene, camera, renderer;
let playerMesh, playerBody;
let equipment = [];
let keys = {};
let nearbyEquipment = null;

// Workout State
let workoutState = {
    progress: 0,
    targetProgress: 100,
    type: null,
    strGain: 0,
    endGain: 0
};

// Initialize Three.js
function initThree() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f1a);
    scene.fog = new THREE.Fog(0x0f0f1a, 20, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    scene.add(mainLight);

    // Add colored accent lights
    const blueLight = new THREE.PointLight(0x00d4ff, 0.5, 30);
    blueLight.position.set(-10, 5, -10);
    scene.add(blueLight);

    const greenLight = new THREE.PointLight(0x00ff88, 0.5, 30);
    greenLight.position.set(10, 5, 10);
    scene.add(greenLight);

    // Create gym environment
    createGym();

    // Create player
    createPlayer();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}

// Create Gym Environment
function createGym() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid lines on floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x00ff88, 0x1a1a2e);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.9,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 10),
        wallMaterial
    );
    backWall.position.set(0, 5, -20);
    scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 10),
        wallMaterial
    );
    leftWall.position.set(-20, 5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 10),
        wallMaterial
    );
    rightWall.position.set(20, 5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Create gym equipment
    createDumbbellRack(-8, 0, -8);
    createBenchPress(8, 0, -8);
    createTreadmill(0, 0, -12);
    createPunchingBag(-8, 0, 8);
    createPullUpBar(8, 0, 8);
}

// Create Dumbbell Rack
function createDumbbellRack(x, y, z) {
    const group = new THREE.Group();

    // Rack base
    const baseGeometry = new THREE.BoxGeometry(4, 0.2, 2);
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, metalMaterial);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Rack posts
    const postGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    for (let i = -1.5; i <= 1.5; i += 1.5) {
        const post1 = new THREE.Mesh(postGeometry, metalMaterial);
        post1.position.set(i, 0.85, -0.8);
        post1.castShadow = true;
        group.add(post1);

        const post2 = new THREE.Mesh(postGeometry, metalMaterial);
        post2.position.set(i, 0.85, 0.8);
        post2.castShadow = true;
        group.add(post2);
    }

    // Dumbbells
    const dumbbellMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        roughness: 0.4,
        metalness: 0.6
    });

    for (let i = -1.5; i <= 1.5; i += 1.5) {
        const dumbbellGroup = new THREE.Group();

        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
        const handle = new THREE.Mesh(handleGeometry, metalMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.y = 0.5;
        dumbbellGroup.add(handle);

        // Weights
        const weightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
        const weight1 = new THREE.Mesh(weightGeometry, dumbbellMaterial);
        weight1.rotation.z = Math.PI / 2;
        weight1.position.set(-0.5, 0.5, 0);
        weight1.castShadow = true;
        dumbbellGroup.add(weight1);

        const weight2 = new THREE.Mesh(weightGeometry, dumbbellMaterial);
        weight2.rotation.z = Math.PI / 2;
        weight2.position.set(0.5, 0.5, 0);
        weight2.castShadow = true;
        dumbbellGroup.add(weight2);

        dumbbellGroup.position.set(i, 0.2, 0);
        group.add(dumbbellGroup);
    }

    group.position.set(x, y, z);
    group.userData = {
        type: 'dumbbell',
        name: 'Dumbbell Rack',
        strGain: 3,
        endGain: 1,
        energyCost: 15
    };
    scene.add(group);
    equipment.push(group);
}

// Create Bench Press
function createBenchPress(x, y, z) {
    const group = new THREE.Group();

    // Frame
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });

    // Base frame
    const baseGeometry = new THREE.BoxGeometry(3, 0.15, 5);
    const base = new THREE.Mesh(baseGeometry, frameMaterial);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Uprights
    const uprightGeometry = new THREE.BoxGeometry(0.15, 2, 0.15);
    const upright1 = new THREE.Mesh(uprightGeometry, frameMaterial);
    upright1.position.set(-1, 1, -1.5);
    upright1.castShadow = true;
    group.add(upright1);

    const upright2 = new THREE.Mesh(uprightGeometry, frameMaterial);
    upright2.position.set(1, 1, -1.5);
    upright2.castShadow = true;
    group.add(upright2);

    // Bench
    const benchMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        roughness: 0.6,
        metalness: 0.2
    });

    const benchGeometry = new THREE.BoxGeometry(0.8, 0.15, 3);
    const bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.set(0, 0.5, 0.5);
    bench.castShadow = true;
    group.add(bench);

    // Barbell
    const barbellGroup = new THREE.Group();

    // Bar
    const barGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
    const bar = new THREE.Mesh(barGeometry, frameMaterial);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = 1.8;
    barbellGroup.add(bar);

    // Plates
    const plateMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b35,
        roughness: 0.4,
        metalness: 0.6
    });

    const plateGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 2; i++) {
            const plate = new THREE.Mesh(plateGeometry, plateMaterial);
            plate.rotation.x = Math.PI / 2;
            plate.position.set(side * (0.8 + i * 0.15), 1.8, 0);
            plate.castShadow = true;
            barbellGroup.add(plate);
        }
    }

    group.add(barbellGroup);

    group.position.set(x, y, z);
    group.userData = {
        type: 'bench',
        name: 'Bench Press',
        strGain: 5,
        endGain: 2,
        energyCost: 20
    };
    scene.add(group);
    equipment.push(group);
}

// Create Treadmill
function createTreadmill(x, y, z) {
    const group = new THREE.Group();

    // Base
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });

    const baseGeometry = new THREE.BoxGeometry(2, 0.3, 4);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Running belt
    const beltMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
        metalness: 0.1
    });

    const beltGeometry = new THREE.BoxGeometry(1.5, 0.05, 3);
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.set(0, 0.35, 0);
    group.add(belt);

    // Console
    const consoleMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        roughness: 0.4,
        metalness: 0.3
    });

    const consoleGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.3);
    const consoleMesh = new THREE.Mesh(consoleGeometry, consoleMaterial);
    consoleMesh.position.set(0, 1, -1.5);
    consoleMesh.castShadow = true;
    group.add(consoleMesh);

    // Handrails
    const railGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    for (let side = -1; side <= 1; side += 2) {
        const rail = new THREE.Mesh(railGeometry, baseMaterial);
        rail.position.set(side * 0.7, 0.8, -1);
        rail.castShadow = true;
        group.add(rail);
    }

    group.position.set(x, y, z);
    group.userData = {
        type: 'treadmill',
        name: 'Treadmill',
        strGain: 1,
        endGain: 4,
        energyCost: 15
    };
    scene.add(group);
    equipment.push(group);
}

// Create Punching Bag
function createPunchingBag(x, y, z) {
    const group = new THREE.Group();

    // Stand
    const standMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.3, 16);
    const base = new THREE.Mesh(baseGeometry, standMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
    const pole = new THREE.Mesh(poleGeometry, standMaterial);
    pole.position.y = 1.5;
    pole.castShadow = true;
    group.add(pole);

    // Arm
    const armGeometry = new THREE.BoxGeometry(1.5, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeometry, standMaterial);
    arm.position.set(0.5, 2.8, 0);
    arm.castShadow = true;
    group.add(arm);

    // Punching bag
    const bagMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4757,
        roughness: 0.6,
        metalness: 0.2
    });

    // Punching bag (using cylinder instead of capsule)
    const bagGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const bag = new THREE.Mesh(bagGeometry, bagMaterial);
    bag.position.set(1.2, 2.3, 0);
    bag.castShadow = true;
    group.add(bag);

    // Add rounded top
    const topGeometry = new THREE.SphereGeometry(0.3, 16, 8);
    const top = new THREE.Mesh(topGeometry, bagMaterial);
    top.position.set(1.2, 2.7, 0);
    top.castShadow = true;
    group.add(top);

    group.position.set(x, y, z);
    group.userData = {
        type: 'punching',
        name: 'Punching Bag',
        strGain: 3,
        endGain: 2,
        energyCost: 12
    };
    scene.add(group);
    equipment.push(group);
}

// Create Pull Up Bar
function createPullUpBar(x, y, z) {
    const group = new THREE.Group();

    // Frame
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });

    // Base
    const baseGeometry = new THREE.BoxGeometry(2, 0.15, 2);
    const base = new THREE.Mesh(baseGeometry, frameMaterial);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Uprights
    const uprightGeometry = new THREE.BoxGeometry(0.15, 3, 0.15);
    const upright1 = new THREE.Mesh(uprightGeometry, frameMaterial);
    upright1.position.set(-0.8, 1.5, 0);
    upright1.castShadow = true;
    group.add(upright1);

    const upright2 = new THREE.Mesh(uprightGeometry, frameMaterial);
    upright2.position.set(0.8, 1.5, 0);
    upright2.castShadow = true;
    group.add(upright2);

    // Bar
    const barMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        roughness: 0.3,
        metalness: 0.7
    });

    const barGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.8, 0);
    bar.castShadow = true;
    group.add(bar);

    group.position.set(x, y, z);
    group.userData = {
        type: 'pullup',
        name: 'Pull Up Bar',
        strGain: 4,
        endGain: 3,
        energyCost: 18
    };
    scene.add(group);
    equipment.push(group);
}

// Create Player
function createPlayer() {
    playerMesh = new THREE.Group();

    // Body
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        roughness: 0.5,
        metalness: 0.3
    });

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    playerBody = new THREE.Mesh(torsoGeometry, bodyMaterial);
    playerBody.position.y = 1.2;
    playerBody.castShadow = true;
    playerMesh.add(playerBody);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    playerMesh.add(head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.4, 1.2, 0);
    leftArm.castShadow = true;
    playerMesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.4, 1.2, 0);
    rightArm.castShadow = true;
    playerMesh.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.15, 0.45, 0);
    leftLeg.castShadow = true;
    playerMesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.15, 0.45, 0);
    rightLeg.castShadow = true;
    playerMesh.add(rightLeg);

    playerMesh.position.set(0, 0, 5);
    scene.add(playerMesh);
}

// Input Handling
function onKeyDown(event) {
    keys[event.code] = true;

    if (event.code === 'KeyE' && nearbyEquipment && !gameState.inWorkout) {
        startWorkout(nearbyEquipment);
    }

    if (event.code === 'Space' && gameState.inWorkout) {
        event.preventDefault();
        doWorkoutRep();
    }
}

function onKeyUp(event) {
    keys[event.code] = false;
}

// Player Movement
function updatePlayer(delta) {
    if (gameState.inWorkout) return;

    const speed = keys['SpaceLeft'] ? 8 : 5;
    const moveSpeed = speed * delta;

    let moved = false;

    if (keys['KeyW']) {
        playerMesh.position.z -= moveSpeed;
        moved = true;
    }
    if (keys['KeyS']) {
        playerMesh.position.z += moveSpeed;
        moved = true;
    }
    if (keys['KeyA']) {
        playerMesh.position.x -= moveSpeed;
        moved = true;
    }
    if (keys['KeyD']) {
        playerMesh.position.x += moveSpeed;
        moved = true;
    }

    // Clamp position
    playerMesh.position.x = Math.max(-18, Math.min(18, playerMesh.position.x));
    playerMesh.position.z = Math.max(-18, Math.min(18, playerMesh.position.z));

    // Rotate player to face movement direction
    if (moved) {
        const targetRotation = Math.atan2(
            (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0),
            (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0)
        );
        playerMesh.rotation.y = targetRotation;
    }

    // Animate player when moving
    if (moved) {
        const time = Date.now() * 0.01;
        playerBody.rotation.x = Math.sin(time) * 0.1;
    } else {
        playerBody.rotation.x *= 0.9;
    }

    // Update camera to follow player
    const targetCamX = playerMesh.position.x * 0.3;
    const targetCamZ = playerMesh.position.z * 0.3 + 12;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;
    camera.lookAt(playerMesh.position.x * 0.5, 0, playerMesh.position.z * 0.5);

    // Check for nearby equipment
    checkNearbyEquipment();
}

// Check for nearby equipment
function checkNearbyEquipment() {
    let closest = null;
    let closestDist = 3;

    for (const eq of equipment) {
        const dist = playerMesh.position.distanceTo(eq.position);
        if (dist < closestDist) {
            closestDist = dist;
            closest = eq;
        }
    }

    nearbyEquipment = closest;

    const prompt = document.getElementById('interaction-prompt');
    const promptText = document.getElementById('prompt-text');

    if (nearbyEquipment) {
        prompt.classList.remove('hidden');
        promptText.textContent = nearbyEquipment.userData.name;
    } else {
        prompt.classList.add('hidden');
    }
}

// Start Workout
function startWorkout(equipment) {
    if (player.energy < equipment.userData.energyCost) {
        return;
    }

    gameState.inWorkout = true;
    workoutState = {
        progress: 0,
        targetProgress: 100,
        type: equipment.userData.type,
        strGain: 0,
        endGain: 0
    };

    // Show workout overlay
    const overlay = document.getElementById('workout-overlay');
    const title = document.getElementById('workout-title');
    const instruction = document.getElementById('workout-instruction');

    title.textContent = equipment.userData.name.toUpperCase();
    instruction.textContent = 'Press SPACE repeatedly!';

    overlay.classList.remove('hidden');

    // Reset gains display
    document.getElementById('str-gain').textContent = '+0';
    document.getElementById('end-gain').textContent = '+0';
}

// Do Workout Rep
function doWorkoutRep() {
    if (!gameState.inWorkout) return;

    workoutState.progress += 5;

    // Calculate gains based on equipment
    const eq = nearbyEquipment;
    if (eq) {
        workoutState.strGain += Math.ceil(eq.userData.strGain * 0.2);
        workoutState.endGain += Math.ceil(eq.userData.endGain * 0.2);
    }

    // Update UI
    updateWorkoutUI();

    // Check if complete
    if (workoutState.progress >= workoutState.targetProgress) {
        completeWorkout();
    }
}

// Update Workout UI
function updateWorkoutUI() {
    const progressCircle = document.getElementById('workout-progress');
    const progressPercent = document.getElementById('workout-percent');
    const strGain = document.getElementById('str-gain');
    const endGain = document.getElementById('end-gain');

    const circumference = 283;
    const offset = circumference - (workoutState.progress / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    progressCircle.style.strokeDasharray = circumference;
    progressPercent.textContent = Math.floor(workoutState.progress) + '%';

    strGain.textContent = '+' + workoutState.strGain;
    endGain.textContent = '+' + workoutState.endGain;
}

// Complete Workout
function completeWorkout() {
    gameState.inWorkout = false;

    // Apply gains
    player.strength = Math.min(100, player.strength + workoutState.strGain);
    player.endurance = Math.min(100, player.endurance + workoutState.endGain);

    // Calculate XP
    const xpGain = workoutState.strGain + workoutState.endGain + 10;
    gainXP(xpGain);

    // Use energy
    const eq = nearbyEquipment;
    if (eq) {
        player.energy = Math.max(0, player.energy - eq.userData.energyCost);
    }

    // Hide overlay
    document.getElementById('workout-overlay').classList.add('hidden');

    // Update UI
    updateUI();
}

// Gain XP
function gainXP(amount) {
    player.xp += amount;

    if (player.xp >= player.maxXp) {
        levelUp();
    }
}

// Level Up
function levelUp() {
    player.level++;
    player.xp = 0;
    player.maxXp = Math.floor(player.maxXp * 1.3);

    // Increase all stats
    player.strength = Math.min(100, player.strength + 2);
    player.endurance = Math.min(100, player.endurance + 2);
    player.speed = Math.min(100, player.speed + 2);
    player.maxEnergy = Math.min(100, player.maxEnergy + 5);
    player.energy = player.maxEnergy;

    // Show level up modal
    const modal = document.getElementById('level-up-modal');
    document.getElementById('new-level').textContent = player.level;
    modal.classList.remove('hidden');
}

// Update UI
function updateUI() {
    document.getElementById('level').textContent = player.level;
    document.getElementById('xp-text').textContent = `${player.xp}/${player.maxXp}`;
    document.getElementById('xp-bar').style.width = `${(player.xp / player.maxXp) * 100}%`;

    document.getElementById('strength').textContent = player.strength;
    document.getElementById('endurance').textContent = player.endurance;
    document.getElementById('speed').textContent = player.speed;

    document.getElementById('energy-text').textContent = `${player.energy}/${player.maxEnergy}`;
    document.getElementById('energy-bar').style.width = `${(player.energy / player.maxEnergy) * 100}%`;
}

// Energy Regeneration
function updateEnergy(delta) {
    if (!gameState.inWorkout && player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + delta * 2);
        updateUI();
    }
}

// Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (gameState.started && !gameState.paused) {
        updatePlayer(delta);
        updateEnergy(delta);
    }

    renderer.render(scene, camera);
}

// Start Game
function startGame() {
    gameState.started = true;
    document.getElementById('start-screen').classList.add('hidden');
    updateUI();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initThree();
    animate(0);

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);

    // Continue button
    document.getElementById('continue-btn').addEventListener('click', function() {
        document.getElementById('level-up-modal').classList.add('hidden');
        updateUI();
    });
});