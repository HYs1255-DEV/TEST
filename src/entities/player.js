import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const GRAVITY = 90;
const JUMP_VELOCITY = 36;
const BASE_SPEED = 28;

/**
 * Représente le cube contrôlé par le joueur dans l'espace 3D.
 */
export class Player {
  constructor(scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7cf2ff,
      emissive: 0x1a3cf5,
      emissiveIntensity: 0.45,
      metalness: 0.2,
      roughness: 0.3,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    this.velocityY = 0;
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.grounded = true;
    this.groundHeight = 0.5; // centre du cube quand il touche le sol
    this.boundingBox = new THREE.Box3();
    this.prevBottom = 0;
    this.attachedPlatform = null;
    this.reset();
  }

  reset() {
    this.mesh.position.set(0, this.groundHeight, 0);
    this.velocityY = 0;
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.grounded = true;
    this.attachedPlatform = null;
    this.updateBoundingBox();
    this.prevBottom = this.boundingBox.min.y;
  }

  setSpeedMultiplier(multiplier) {
    this.speed = BASE_SPEED * multiplier;
  }

  requestJump() {
    if (this.grounded) {
      this.attachedPlatform = null;
      this.velocityY = JUMP_VELOCITY;
      this.grounded = false;
    }
  }

  update(dt) {
    this.prevBottom = this.boundingBox.min.y;
    if (this.attachedPlatform) {
      const top = this.attachedPlatform.boundingBox.max.y;
      this.mesh.position.y = top + 0.5;
      this.velocityY = 0;
      this.grounded = true;
    } else {
      this.velocityY -= GRAVITY * dt;
      this.mesh.position.y += this.velocityY * dt;
      if (this.mesh.position.y <= this.groundHeight) {
        this.landOn(0);
      }
    }
    this.mesh.rotation.x = Math.sin(performance.now() * 0.003) * 0.08;
    this.mesh.rotation.z = Math.cos(performance.now() * 0.0025) * 0.08;
    this.updateBoundingBox();
  }

  advance(dt) {
    const delta = this.speed * dt;
    this.mesh.position.z += delta;
    this.distance += delta;
    this.updateBoundingBox();
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }

  landOn(surfaceY, platform = null) {
    this.mesh.position.y = surfaceY + 0.5;
    this.velocityY = 0;
    this.grounded = true;
    this.attachedPlatform = platform;
    this.updateBoundingBox();
    this.prevBottom = this.boundingBox.min.y;
  }
}
