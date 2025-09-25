import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const SEGMENT_LENGTH = 36;
const SEGMENT_COUNT = 8;
const CORRIDOR_WIDTH = 10;
const SPAWN_DISTANCE = 320;

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.speedZones = [];
    this.floorSegments = [];
    this.spawnCursor = 30;
    this.starField = null;

    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1024,
      emissive: 0x050a1c,
      emissiveIntensity: 0.35,
      metalness: 0.45,
      roughness: 0.55,
    });
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x070c1c,
      emissive: 0x081a3a,
      emissiveIntensity: 0.4,
      metalness: 0.25,
      roughness: 0.7,
    });
    this.neonMaterial = new THREE.MeshStandardMaterial({
      color: 0x4c7dff,
      emissive: 0x4c7dff,
      emissiveIntensity: 1.8,
      metalness: 0.1,
      roughness: 0.2,
    });

    this.buildEnvironment();
  }

  buildEnvironment() {
    this.scene.fog = new THREE.Fog(0x040712, 14, 180);

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const group = this.createCorridorSegment();
      group.position.z = (i - 2) * SEGMENT_LENGTH;
      this.scene.add(group);
      this.floorSegments.push(group);
    }

    const skyGeometry = new THREE.SphereGeometry(120, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x050916,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = 0;
    this.scene.add(sky);

    this.starField = this.createStarField();
    this.scene.add(this.starField);

    const lightRailGeometry = new THREE.BoxGeometry(0.5, 0.25, SEGMENT_COUNT * SEGMENT_LENGTH);
    const lightRail = new THREE.Mesh(lightRailGeometry, this.neonMaterial.clone());
    lightRail.position.set(0, 3.4, (SEGMENT_COUNT * SEGMENT_LENGTH) / 2 - SEGMENT_LENGTH * 2);
    lightRail.castShadow = false;
    lightRail.receiveShadow = false;
    this.scene.add(lightRail);
  }

  createStarField() {
    const starCount = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 40 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 8 + Math.random() * 16;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x6c8cff,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.rotation.x = Math.PI / 2;
    return points;
  }

  createCorridorSegment() {
    const group = new THREE.Group();

    const floorGeometry = new THREE.BoxGeometry(CORRIDOR_WIDTH, 0.6, SEGMENT_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    floor.position.y = -0.3;
    floor.castShadow = false;
    floor.receiveShadow = true;
    group.add(floor);

    const wallGeometry = new THREE.BoxGeometry(0.7, 5.2, SEGMENT_LENGTH);
    const neonGeometry = new THREE.BoxGeometry(0.15, 4.8, SEGMENT_LENGTH);
    const leftWall = new THREE.Mesh(wallGeometry, this.wallMaterial);
    leftWall.position.set(-CORRIDOR_WIDTH / 2 - 0.35, 2.0, 0);
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = CORRIDOR_WIDTH / 2 + 0.35;
    group.add(rightWall);

    const leftNeon = new THREE.Mesh(neonGeometry, this.neonMaterial);
    leftNeon.position.set(-CORRIDOR_WIDTH / 2 - 0.2, 2.0, 0);
    group.add(leftNeon);

    const rightNeon = leftNeon.clone();
    rightNeon.position.x = CORRIDOR_WIDTH / 2 + 0.2;
    group.add(rightNeon);

    return group;
  }

  reset() {
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle.mesh);
    }
    this.obstacles = [];
    this.speedZones = [];
    this.spawnCursor = 30;

    for (let i = 0; i < this.floorSegments.length; i++) {
      this.floorSegments[i].position.z = (i - 2) * SEGMENT_LENGTH;
    }
  }

  update(dt, playerZ) {
    this.animateEnvironment(dt, playerZ);
    this.recycleFloor(playerZ);
    this.cleanup(playerZ);
    this.ensureSpawn(playerZ + SPAWN_DISTANCE);
    this.updateObstacles(dt);
  }

  animateEnvironment(dt, playerZ) {
    if (this.starField) {
      this.starField.rotation.y += dt * 0.05;
      this.starField.position.z = playerZ + 40;
    }
  }

  recycleFloor(playerZ) {
    const totalLength = SEGMENT_COUNT * SEGMENT_LENGTH;
    for (const segment of this.floorSegments) {
      if (segment.position.z + SEGMENT_LENGTH < playerZ - SEGMENT_LENGTH) {
        segment.position.z += totalLength;
      }
    }
  }

  cleanup(playerZ) {
    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.mesh.position.z < playerZ - 20) {
        this.scene.remove(obstacle.mesh);
        return false;
      }
      return true;
    });
    this.speedZones = this.speedZones.filter((zone) => zone.end > playerZ - 10);
  }

  ensureSpawn(targetZ) {
    while (this.spawnCursor < targetZ) {
      this.spawnChunk();
    }
  }

  spawnChunk() {
    const chunkStart = this.spawnCursor + 8;
    const chunkLength = 26 + Math.random() * 18;
    const chunkEnd = chunkStart + chunkLength;
    const patternCount = Math.max(3, Math.floor(chunkLength / 6));

    for (let i = 0; i < patternCount; i++) {
      const z = chunkStart + i * (chunkLength / patternCount) + THREE.MathUtils.randFloatSpread(1.5);
      const selector = Math.random();
      if (selector < 0.4) {
        this.spawnSpike(z);
      } else if (selector < 0.75) {
        this.spawnBlock(z);
      } else {
        this.spawnMovingPlatform(z);
      }
    }

    if (Math.random() < 0.35) {
      this.speedZones.push({ start: chunkStart, end: chunkEnd, multiplier: 1.35 });
    }

    this.spawnCursor = chunkEnd + 12;
  }

  spawnSpike(z) {
    const geometry = new THREE.ConeGeometry(0.6, 1.3, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff5b7c,
      emissive: 0xff2d56,
      emissiveIntensity: 0.9,
      metalness: 0.3,
      roughness: 0.4,
    });
    const spike = new THREE.Mesh(geometry, material);
    spike.rotation.y = Math.PI / 4;
    spike.position.set(0, 0.65, z);
    spike.castShadow = true;
    spike.receiveShadow = true;
    this.addObstacle(spike, { type: 'spike' });
  }

  spawnBlock(z) {
    const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7cf2ff,
      emissive: 0x1e53ff,
      emissiveIntensity: 0.6,
      metalness: 0.25,
      roughness: 0.35,
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.set(0, 0.8, z);
    block.castShadow = true;
    block.receiveShadow = true;
    this.addObstacle(block, { type: 'block' });
  }

  spawnMovingPlatform(z) {
    const geometry = new THREE.BoxGeometry(2.4, 0.4, 2.4);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffe66d,
      emissive: 0xffc53d,
      emissiveIntensity: 1.2,
      metalness: 0.15,
      roughness: 0.25,
    });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(0, 1.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.addObstacle(platform, {
      type: 'movingPlatform',
      behavior: {
        kind: 'bob',
        speed: 2.4 + Math.random() * 1.4,
        amplitude: 0.6 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      },
    });
  }

  addObstacle(mesh, options) {
    const obstacle = {
      mesh,
      type: options.type,
      behavior: options.behavior ?? null,
      boundingBox: new THREE.Box3().setFromObject(mesh),
      baseY: mesh.position.y,
      phase: options.behavior?.phase ?? 0,
    };
    this.scene.add(mesh);
    this.obstacles.push(obstacle);
  }

  updateObstacles(dt) {
    for (const obstacle of this.obstacles) {
      if (obstacle.behavior?.kind === 'bob') {
        obstacle.phase += obstacle.behavior.speed * dt;
        obstacle.mesh.position.y = obstacle.baseY + Math.sin(obstacle.phase) * obstacle.behavior.amplitude;
      }
      obstacle.boundingBox.setFromObject(obstacle.mesh);
    }
  }

  handlePlayerCollision(player) {
    let landedPlatform = null;
    for (const obstacle of this.obstacles) {
      if (!obstacle.boundingBox.intersectsBox(player.boundingBox)) {
        continue;
      }

      if (obstacle.type === 'block' || obstacle.type === 'movingPlatform') {
        const top = obstacle.boundingBox.max.y;
        const prevBottom = player.prevBottom;
        const bottom = player.boundingBox.min.y;
        const descending = player.velocityY <= 0.0001;
        const wasAbove = prevBottom >= top - 0.06;
        const nowOnTop = bottom <= top + 0.12;

        if (wasAbove && nowOnTop && descending) {
          const platformRef = obstacle.type === 'movingPlatform' ? obstacle : null;
          player.landOn(top, platformRef);
          landedPlatform = platformRef;
          continue;
        }
      }

      return { dead: true };
    }

    if (!landedPlatform && player.attachedPlatform) {
      player.attachedPlatform = null;
      player.grounded = false;
    }

    return { dead: false };
  }

  getSpeedMultiplier(playerZ) {
    let multiplier = 1 + Math.min(playerZ / 900, 0.6);
    for (const zone of this.speedZones) {
      if (playerZ >= zone.start && playerZ <= zone.end) {
        multiplier *= zone.multiplier;
      }
    }
    return multiplier;
  }
}
