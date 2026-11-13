
import * as THREE from "three";

const DEG = Math.PI / 180;

// Referências dos servos físicos
const JOINT_CONFIG = {
  shoulder: {
    reference: 90,
    direction: 1
  },

  elbow: {
    reference: 180,
    direction: 1
  },

  wrist: {
    reference: 90,
    direction: 1
  }
};

let scene;
let camera;
let renderer;
let controls;

let shoulderPivot;
let elbowPivot;
let wristPivot;

let animationFrame;

export function initRobot3D(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151d);

  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(4, 4, 6);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  container.appendChild(renderer.domElement);

  // Iluminação
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    1.5
  );

  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    2
  );

  directionalLight.position.set(5, 8, 5);
  scene.add(directionalLight);

  // Chão
  const floorGeometry = new THREE.PlaneGeometry(20, 20);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x202a36,
    roughness: 0.9
  });

  const floor = new THREE.Mesh(
    floorGeometry,
    floorMaterial
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.1;

  scene.add(floor);

  // Materiais
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x26384b,
    metalness: 0.6,
    roughness: 0.4
  });

  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a45c,
    metalness: 0.25,
    roughness: 0.65
  });

  const jointMaterial = new THREE.MeshStandardMaterial({
    color: 0x2785c7,
    metalness: 0.65,
    roughness: 0.3
  });

  const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0x9aa8b7,
    metalness: 0.7,
    roughness: 0.3
  });

  // Base fixa
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.75, 0.25, 32),
    baseMaterial
  );

  base.position.y = 0.05;
  scene.add(base);

  // Suporte do ombro
  const shoulderSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.55, 0.45),
    baseMaterial
  );

  shoulderSupport.position.y = 0.45;
  scene.add(shoulderSupport);

  // Pivô do ombro
  shoulderPivot = new THREE.Group();
  shoulderPivot.position.set(0, 0.7, 0);

  scene.add(shoulderPivot);

  const shoulderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.3, 32),
    jointMaterial
  );

  shoulderMotor.rotation.x = Math.PI / 2;
  shoulderPivot.add(shoulderMotor);

  // Braço superior
  const upperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.56, 0.28),
    armMaterial
  );

  upperArm.position.y = 0.78;
  shoulderPivot.add(upperArm);

  // Pivô do cotovelo
  elbowPivot = new THREE.Group();
  elbowPivot.position.set(0, 1.56, 0);

  shoulderPivot.add(elbowPivot);

  const elbowMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.23, 0.35, 32),
    jointMaterial
  );

  elbowMotor.rotation.x = Math.PI / 2;
  elbowPivot.add(elbowMotor);

  // Antebraço
  const forearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 1.23, 0.24),
    armMaterial
  );

  forearm.position.y = 0.615;
  elbowPivot.add(forearm);

  // Pivô da mão
  wristPivot = new THREE.Group();
  wristPivot.position.set(0, 1.23, 0);

  elbowPivot.add(wristPivot);

  const wristMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.3, 32),
    jointMaterial
  );

  wristMotor.rotation.x = Math.PI / 2;
  wristPivot.add(wristMotor);

  // Placa giratória
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.65),
    plateMaterial
  );

  plate.position.y = 0.18;
  wristPivot.add(plate);

  // Eixos de referência
  const axes = new THREE.AxesHelper(2);
  scene.add(axes);

  // Grade
  const grid = new THREE.GridHelper(
    20,
    20,
    0x526477,
    0x303b48
  );

  grid.position.y = -0.09;
  scene.add(grid);

  // Animação
  function animate() {
    animationFrame = requestAnimationFrame(animate);

    renderer.render(scene, camera);
  }

  animate();

  // Redimensionamento
  const resizeObserver = new ResizeObserver(() => {
    if (!container.clientWidth || !container.clientHeight) {
      return;
    }

    camera.aspect =
      container.clientWidth / container.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );
  });

  resizeObserver.observe(container);

  // Posição inicial
  setPose({
    angleS: 90,
    angleE: 180,
    angleH: 90
  });
}

export function setPose({ angleS, angleE, angleH }) {
  if (!shoulderPivot || !elbowPivot || !wristPivot) {
    return;
  }

  // Ombro: rotação axial do braço inteiro
  shoulderPivot.rotation.y =
    (angleS - 90) * DEG;

  // Cotovelo: dobra do antebraço
  elbowPivot.rotation.x =
    (angleE - 180) * DEG;

  // Mão: rotação axial da placa
  wristPivot.rotation.y =
    (angleH - 90) * DEG;
}
export function resetCamera() {
  if (!camera) return;

  camera.position.set(4, 4, 6);
  camera.lookAt(0, 2, 0);
}
