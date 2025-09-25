import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { AudioManager } from '../audio/audioManager.js';
import { Engine } from '../core/engine.js';
import { Input } from '../core/input.js';
import { Player } from '../entities/player.js';
import { Level } from '../level/level.js';

export class Game {
  constructor(container, statusElement) {
    this.container = container;
    this.statusElement = statusElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030712);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    this.camera.position.set(0, 3.2, -10);

    this.statusDuration = 0;
    this.cameraTarget = new THREE.Vector3();

    this.addLights();

    this.level = new Level(this.scene);
    this.player = new Player(this.scene);
    this.input = new Input(this.renderer.domElement);
    this.audio = new AudioManager();

    this.engine = new Engine({
      update: (dt) => this.update(dt),
      render: () => this.render(),
      targetFps: 120,
    });

    this.handleResize = () => this.resize();
    window.addEventListener('resize', this.handleResize);
    this.resize();

    this.boundStartAudio = () => this.startAudio();
    this.renderer.domElement.addEventListener('mousedown', this.boundStartAudio);
    this.renderer.domElement.addEventListener('touchstart', this.boundStartAudio, { passive: false });

    this.showStatus('Bonne chance !', 2);
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0x6c7fff, 0.45);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
    mainLight.position.set(6, 10, -8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 60;
    mainLight.shadow.camera.left = -12;
    mainLight.shadow.camera.right = 12;
    mainLight.shadow.camera.top = 12;
    mainLight.shadow.camera.bottom = -4;
    this.scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x3d7cff, 2.4, 40, 2);
    rimLight.position.set(-4, 3, -6);
    this.scene.add(rimLight);
  }

  async loadMusic(url) {
    await this.audio.loadMusic(url);
  }

  startAudio() {
    if (this.audio && this.audio.audio) {
      this.audio.play();
    }
  }

  resize() {
    const { clientWidth, clientHeight } = this.container;
    this.renderer.setSize(clientWidth, clientHeight, false);
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.engine.start();
  }

  update(dt) {
    if (this.input.consumeJumpRequest()) {
      this.player.requestJump();
    }

    const speedMultiplier = this.level.getSpeedMultiplier(this.player.mesh.position.z);
    this.player.setSpeedMultiplier(speedMultiplier);
    this.player.advance(dt);

    this.level.update(dt, this.player.mesh.position.z);

    this.player.update(dt);

    const collision = this.level.handlePlayerCollision(this.player);
    if (collision.dead) {
      this.fail();
      return;
    }

    this.updateCamera(dt);
    this.updateStatus(dt);
  }

  updateCamera(dt) {
    const targetZ = this.player.mesh.position.z - 9.5;
    const targetY = this.player.mesh.position.y + 2.6;
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.12);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 0.05);
    this.cameraTarget.set(0, this.player.mesh.position.y + 0.4, this.player.mesh.position.z + 6);
    this.camera.lookAt(this.cameraTarget);
  }

  updateStatus(dt) {
    if (!this.statusElement) {
      return;
    }
    if (this.statusDuration > 0) {
      this.statusDuration -= dt;
      if (this.statusDuration <= 0) {
        this.statusDuration = 0;
      } else {
        return;
      }
    }
    const distance = Math.floor(this.player.distance);
    const speed = this.player.speed.toFixed(1);
    this.statusElement.textContent = `Distance : ${distance} m • Vitesse : ${speed} u/s`;
  }

  showStatus(message, duration) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
    this.statusDuration = duration;
  }

  fail() {
    this.showStatus('Crash ! Reprise au début...', 2.5);
    this.audio.stop();
    this.level.reset();
    this.player.reset();
    this.camera.position.set(0, 3.2, -10);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
