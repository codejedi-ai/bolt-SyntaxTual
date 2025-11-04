import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DNAHelix: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const helixGroup = new THREE.Group();
    scene.add(helixGroup);

    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cylinderGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);

    const material1 = new THREE.MeshPhongMaterial({
      color: 0x00d9ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 0.3,
      shininess: 100,
    });

    const material2 = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.3,
      shininess: 100,
    });

    const connectionMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    const numPairs = 20;
    const helixRadius = 3;
    const helixHeight = 12;
    const rotationStep = (Math.PI * 2) / 10;

    for (let i = 0; i < numPairs; i++) {
      const y = (i / numPairs) * helixHeight - helixHeight / 2;
      const angle = i * rotationStep;

      const sphere1 = new THREE.Mesh(sphereGeometry, material1);
      sphere1.position.set(
        Math.cos(angle) * helixRadius,
        y,
        Math.sin(angle) * helixRadius
      );
      helixGroup.add(sphere1);

      const sphere2 = new THREE.Mesh(sphereGeometry, material2);
      sphere2.position.set(
        Math.cos(angle + Math.PI) * helixRadius,
        y,
        Math.sin(angle + Math.PI) * helixRadius
      );
      helixGroup.add(sphere2);

      const connection = new THREE.Mesh(cylinderGeometry, connectionMaterial);
      connection.position.set(0, y, 0);
      connection.rotation.z = Math.PI / 2;
      connection.rotation.y = angle;
      connection.scale.y = helixRadius * 2;
      helixGroup.add(connection);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d9ff, 1, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1, 50);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      helixGroup.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      helixGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
};

export default DNAHelix;
