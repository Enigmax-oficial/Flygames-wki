import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Rotate3d, 
  RotateCcw, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Sliders,
  Activity
} from 'lucide-react';
import { 
  BedrockGeometry, 
  BedrockModelFile, 
  MINECRAFT_MODELS_REGISTRY, 
  createDefaultMinecraftTexture 
} from '../models';
import { evaluateMolang, ZOMBIE_BEDROCK_ANIMATIONS, MolangVariables } from '../lib/BedrockAnimationEvaluator';

interface MinecraftModel3DProps {
  modelData?: BedrockModelFile;
  modelKey?: string;
  textureUrl?: string;
  pageTitle?: string;
}

export const MinecraftModel3D: React.FC<MinecraftModel3DProps> = ({
  modelData,
  modelKey,
  textureUrl,
  pageTitle = 'Minecraft 3D Entity'
}) => {
  const resolvedModelKey = modelKey || Object.keys(MINECRAFT_MODELS_REGISTRY)[0];
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeAnimation, setActiveAnimation] = useState<'idle' | 'attack' | 'swimming' | 'baby_attack'>('idle');

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mouse drag state
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 400;
    const height = mountRef.current.clientHeight || 340;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 55);
    camera.lookAt(0, 12, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Clear previous children
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(20, 40, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.6);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Grid Floor Pedestal
    const gridHelper = new THREE.GridHelper(30, 15, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 5. Select & Parse Minecraft Bedrock Geometry
    const activeKey = resolvedModelKey;
    const normalizedKey = activeKey ? activeKey.toLowerCase().replace(/-/g, '_') : '';
    const activeModelFile =
      modelData ||
      MINECRAFT_MODELS_REGISTRY[activeKey] ||
      MINECRAFT_MODELS_REGISTRY[normalizedKey];

    if (!activeModelFile) {
      // Clean fallback if no model exists for this entity
      return;
    }

    const geomData: BedrockGeometry | undefined = activeModelFile?.['minecraft:geometry']?.[0];

    // Texture Creation
    let texture: THREE.Texture;
    const resolvedTextureUrl =
      textureUrl || createDefaultMinecraftTexture(geomData?.description?.identifier || activeKey);

    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load(resolvedTextureUrl);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      wireframe: wireframe,
    });

    // 6. Build Bones & Cubes Group
    const rootGroup = new THREE.Group();
    modelGroupRef.current = rootGroup;
    const initialBoneRotations = new Map<string, THREE.Euler>();

    if (geomData && geomData.bones) {
      const boneMap = new Map<string, THREE.Group>();

      // Create groups for each bone
      geomData.bones.forEach((bone) => {
        const boneGroup = new THREE.Group();
        boneGroup.name = bone.name;

        if (bone.pivot) {
          boneGroup.position.set(bone.pivot[0], bone.pivot[1], bone.pivot[2]);
        }

        if (bone.rotation) {
          const rx = (bone.rotation[0] || 0) * (Math.PI / 180);
          const ry = (bone.rotation[1] || 0) * (Math.PI / 180);
          const rz = (bone.rotation[2] || 0) * (Math.PI / 180);
          boneGroup.rotation.set(rx, ry, rz);
          initialBoneRotations.set(bone.name, new THREE.Euler(rx, ry, rz));
        } else {
          initialBoneRotations.set(bone.name, new THREE.Euler(0, 0, 0));
        }

        boneMap.set(bone.name, boneGroup);

        // Render cubes inside bone
        if (bone.cubes) {
          bone.cubes.forEach((cube) => {
            const [w, h, d] = cube.size;
            const [ox, oy, oz] = cube.origin;
            const inflate = cube.inflate || 0;

            const boxGeo = new THREE.BoxGeometry(
              w + inflate * 2,
              h + inflate * 2,
              d + inflate * 2
            );

            const mesh = new THREE.Mesh(boxGeo, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Position cube relative to bone pivot
            const pivot = bone.pivot || [0, 0, 0];
            mesh.position.set(
              ox + w / 2 - pivot[0],
              oy + h / 2 - pivot[1],
              oz + d / 2 - pivot[2]
            );

            boneGroup.add(mesh);
          });
        }
      });

      // Assemble bone hierarchy
      geomData.bones.forEach((bone) => {
        const boneGroup = boneMap.get(bone.name);
        if (boneGroup) {
          if (bone.parent && boneMap.has(bone.parent)) {
            const parentGroup = boneMap.get(bone.parent)!;
            const parentBone = geomData.bones.find((b) => b.name === bone.parent);
            if (parentBone && parentBone.pivot && bone.pivot) {
              boneGroup.position.set(
                bone.pivot[0] - parentBone.pivot[0],
                bone.pivot[1] - parentBone.pivot[1],
                bone.pivot[2] - parentBone.pivot[2]
              );
            }
            parentGroup.add(boneGroup);
          } else {
            rootGroup.add(boneGroup);
          }
        }
      });
    }

    scene.add(rootGroup);

    // 7. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (modelGroupRef.current) {
        if (isAutoRotate && !isDraggingRef.current) {
          modelGroupRef.current.rotation.y += 0.01;
        }

        const findBone = (name: string) => {
          if (!modelGroupRef.current) return null;
          return (
            modelGroupRef.current.getObjectByName(name) ||
            modelGroupRef.current.getObjectByName(name.toLowerCase()) ||
            modelGroupRef.current.getObjectByName(
              name === 'leftarm' ? 'leftArm' :
              name === 'rightarm' ? 'rightArm' :
              name === 'leftleg' ? 'leftLeg' :
              name === 'rightleg' ? 'rightLeg' : name
            )
          );
        };

        // Reset bone rotations to rest pose before applying animation
        initialBoneRotations.forEach((restRot, boneName) => {
          const bone = findBone(boneName);
          if (bone) {
            bone.rotation.copy(restRot);
          }
        });

        const molangVars: MolangVariables = {
          'query.life_time': elapsedTime,
          'variable.attack_time': (Math.sin(elapsedTime * 4) + 1) / 2,
          'variable.swim_amount': activeAnimation === 'swimming' ? 1.0 : 0.0,
          'variable.is_brandishing_spear': 0,
          'query.target_x_rotation': 0,
          'query.is_baby': activeAnimation === 'baby_attack' ? 1 : 0,
          'this': 0,
        };

        if (activeAnimation === 'attack' || activeAnimation === 'baby_attack') {
          const rightArm = findBone('rightArm') || findBone('rightarm');
          const leftArm = findBone('leftArm') || findBone('leftarm');
          const head = findBone('head');
          const body = findBone('body');

          // Smooth attack swing loop
          const attackSwing = Math.sin(elapsedTime * 8);
          const attackPunch = Math.cos(elapsedTime * 8);

          if (rightArm) {
            const rest = initialBoneRotations.get('rightArm') || initialBoneRotations.get('rightarm') || new THREE.Euler(0, 0, 0);
            rightArm.rotation.set(
              rest.x - Math.PI / 2 + attackSwing * 0.3,
              rest.y + attackPunch * 0.15,
              rest.z + 0.1
            );
          }

          if (leftArm) {
            const rest = initialBoneRotations.get('leftArm') || initialBoneRotations.get('leftarm') || new THREE.Euler(0, 0, 0);
            leftArm.rotation.set(
              rest.x - Math.PI / 2 - attackSwing * 0.3,
              rest.y - attackPunch * 0.15,
              rest.z - 0.1
            );
          }

          if (head) {
            const rest = initialBoneRotations.get('head') || new THREE.Euler(0, 0, 0);
            head.rotation.set(rest.x + attackSwing * 0.1, rest.y, rest.z);
          }

          if (body) {
            const rest = initialBoneRotations.get('body') || new THREE.Euler(0, 0, 0);
            body.rotation.set(rest.x + 0.1, rest.y + attackSwing * 0.08, rest.z);
          }
        } else if (activeAnimation === 'swimming') {
          const anim = ZOMBIE_BEDROCK_ANIMATIONS['animation.zombie.swimming'];
          if (anim && anim.bones) {
            Object.entries(anim.bones).forEach(([boneName, boneAnim]) => {
              const bone = findBone(boneName);
              if (bone && boneAnim.rotation) {
                const rest = initialBoneRotations.get(boneName) || new THREE.Euler(0, 0, 0);
                const rx = evaluateMolang(boneAnim.rotation[0], molangVars) * (Math.PI / 180);
                const ry = evaluateMolang(boneAnim.rotation[1], molangVars) * (Math.PI / 180);
                const rz = evaluateMolang(boneAnim.rotation[2], molangVars) * (Math.PI / 180);
                bone.rotation.set(rest.x + rx, rest.y + ry, rest.z + rz);
              }
            });
          }
        } else {
          // Default Idle / Walk Cycles
          const head = findBone('head');
          if (head) {
            const rest = initialBoneRotations.get('head') || new THREE.Euler(0, 0, 0);
            head.rotation.set(rest.x, rest.y + Math.sin(elapsedTime * 1.5) * 0.12, rest.z);
          }

          const rightArm = findBone('rightArm');
          const leftArm = findBone('leftArm');
          if (rightArm) {
            const rest = initialBoneRotations.get('rightArm') || new THREE.Euler(0, 0, 0);
            rightArm.rotation.set(rest.x + Math.sin(elapsedTime * 2.5) * 0.3, rest.y, rest.z);
          }
          if (leftArm) {
            const rest = initialBoneRotations.get('leftArm') || new THREE.Euler(0, 0, 0);
            leftArm.rotation.set(rest.x - Math.sin(elapsedTime * 2.5) * 0.3, rest.y, rest.z);
          }

          const rightLeg = findBone('rightLeg');
          const leftLeg = findBone('leftLeg');
          if (rightLeg) {
            const rest = initialBoneRotations.get('rightLeg') || new THREE.Euler(0, 0, 0);
            rightLeg.rotation.set(rest.x - Math.sin(elapsedTime * 2.5) * 0.3, rest.y, rest.z);
          }
          if (leftLeg) {
            const rest = initialBoneRotations.get('leftLeg') || new THREE.Euler(0, 0, 0);
            leftLeg.rotation.set(rest.x + Math.sin(elapsedTime * 2.5) * 0.3, rest.y, rest.z);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [modelData, modelKey, textureUrl, wireframe, activeAnimation]);

  // Handle Rotation via Dragging
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    previousMousePosition.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousMousePosition.current.x;
    const deltaY = clientY - previousMousePosition.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.01;
    modelGroupRef.current.rotation.x = Math.max(
      -0.8,
      Math.min(0.8, modelGroupRef.current.rotation.x + deltaY * 0.01)
    );

    previousMousePosition.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZoom = Math.max(0.5, Math.min(2.2, zoomLevel + delta));
    setZoomLevel(newZoom);
    cameraRef.current.position.z = 55 / newZoom;
  };

  const handleReset = () => {
    if (modelGroupRef.current && cameraRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 18, 55);
      setZoomLevel(1);
    }
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] bg-[#070a12] rounded-2xl border border-sky-500/30 overflow-hidden shadow-2xl select-none flex flex-col justify-between">
      {/* Title Bar overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0f172a]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#334155] text-xs">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <span className="font-bold text-white uppercase tracking-wide">{pageTitle}</span>
        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[10px] font-mono">
          Minecraft Bedrock JSON
        </span>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Bedrock Animation State Selector Bar */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-[#0f172a]/90 border border-[#334155] rounded-xl p-1 backdrop-blur-md overflow-x-auto max-w-[calc(100%-200px)]">
        <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-sky-400 font-mono font-bold border-r border-[#334155]">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>ANIM:</span>
        </div>
        
        <button
          onClick={() => setActiveAnimation('idle')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
            activeAnimation === 'idle'
              ? 'bg-sky-500 text-black font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          Idle / Walk
        </button>

        <button
          onClick={() => setActiveAnimation('attack')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
            activeAnimation === 'attack'
              ? 'bg-rose-500 text-white font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          Bare Hand Attack
        </button>

        <button
          onClick={() => setActiveAnimation('swimming')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
            activeAnimation === 'swimming'
              ? 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          Swimming
        </button>

        <button
          onClick={() => setActiveAnimation('baby_attack')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
            activeAnimation === 'baby_attack'
              ? 'bg-amber-500 text-black font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          Baby Attack
        </button>
      </div>

      {/* Control bar */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-[#0f172a]/90 border border-[#334155] rounded-xl p-1.5 backdrop-blur-md">
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-mono transition-colors ${
            isAutoRotate ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-[#94a3b8] hover:text-white'
          }`}
          title={isAutoRotate ? 'Pause Rotation' : 'Auto Rotate'}
        >
          {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            wireframe ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-[#94a3b8] hover:text-white'
          }`}
          title="Toggle Wireframe Mesh"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(0.2)}
          className="p-1.5 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(-0.2)}
          className="p-1.5 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          title="Reset Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
