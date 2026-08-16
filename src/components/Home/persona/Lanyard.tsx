/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
  RigidBodyProps,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

// Real card.glb model, sourced from the upstream react-bits repo
// (src/assets/lanyard) — the shadcn registry only ships the component
// source, not this binary asset, so it's vendored here directly. Our own
// brand card face is composited onto the card at runtime. The strap is a
// plain solid colour: no texture, image or logo on the thread, by design.
import cardGLB from "../../../assets/brand/card.glb";
import cardFace from "../../../assets/brand/card.png";

extend({ MeshLineGeometry, MeshLineMaterial });

// The card model's front face is UV-mapped to the LEFT half of its texture
// atlas and the back face to the RIGHT half. Our brand art is composited
// into both halves (aspect-preserving, no stretch) so the card reads the
// same from either side as it spins.
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 40,
  transparent = true,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative z-0 w-full h-full flex justify-center items-center">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0xffffff), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            {/* The vertical anchor is not passed in: Band pins it to the top
                edge of the canvas itself, so the strap always originates from
                behind the navbar with no gap at any viewport size.
                anchorX offsets the hang to the right on desktop (the copy
                occupies the left half); centred on mobile. */}
            <Band isMobile={isMobile} anchorX={isMobile ? 0 : 3.5} ropeLength={2.3} />
          </Physics>
        </Suspense>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  anchorX?: number;
  ropeLength?: number;
}

type LanyardRigidBody = RapierRigidBody & { lerped?: THREE.Vector3 };

interface CardGLTFResult {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
  };
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  anchorX = 0,
  ropeLength = 1,
}: BandProps) {
  const band = useRef<any>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<LanyardRigidBody>(null!);
  const j2 = useRef<LanyardRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const { gl, viewport } = useThree();

  // While the card is being dragged it is a KINEMATIC body, which by
  // definition accumulates no velocity. Releasing it therefore handed the
  // physics engine a dead stop, so the card sagged back instead of carrying
  // the momentum of the gesture — the "throw" the user just made was thrown
  // away. These track the drag velocity so it can be applied on release.
  const dragVel = useRef(new THREE.Vector3());
  const lastDragPos = useRef<THREE.Vector3 | null>(null);
  const releaseVel = useRef<THREE.Vector3 | null>(null);

  // Pin the strap's anchor to the very top edge of the canvas so it is always
  // hidden behind the navbar and the strap reads as originating from under it,
  // with no gap — at ANY viewport size.
  //
  // Why this works: `viewport.height` is the visible height in WORLD units,
  // which is a function of fov and camera distance only — it does not change
  // with the canvas pixel size. So `viewport.height / 2` is the top edge of the
  // frame at every screen size, and the anchor's on-screen position collapses
  // to exactly the canvas top edge regardless of how tall the viewport is.
  // A hard-coded world Y cannot do this: it drifts as the viewport height
  // changes, which is what kept reintroducing the gap.
  // The small 0.2 inset keeps the anchor just inside the frustum.
  const anchorY = viewport.height / 2 - 0.2;

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  // Damping is deliberately much lower than the upstream demo's 4/4. At 4 the
  // chain is heavily OVER-DAMPED: velocity is bled off almost as fast as
  // gravity adds it, so a released card creeps back to rest instead of
  // swinging. A real lanyard is under-damped — it overshoots, swings past
  // centre a couple of times, then settles. These values give that pendulum
  // behaviour while still coming to rest in about a second.
  const segmentProps: RigidBodyProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 1.2,
    linearDamping: 0.9,
  };

  const { nodes, materials } = useGLTF(cardGLB) as unknown as CardGLTFResult;
  const faceTexture = useTexture(cardFace);

  // Measure the card mesh's true width at scale 1, straight from the GLB, so
  // the responsive sizing below is exact rather than relying on a guessed
  // constant (the collider is a loose bounding box and is noticeably wider
  // than the visible card, so it can't be used for this).
  const cardUnitWidth = useMemo(() => {
    const geom = nodes.card.geometry;
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    return bb.max.x - bb.min.x;
  }, [nodes.card.geometry]);

  // The card is a MATCHED SET, authored upstream at scale 2.25: the collider
  // half-extents (0.8 / 1.125), the spherical-joint anchor (1.5) and the mesh
  // offset (-1.2) are all tuned to that exact size. Resizing the card means
  // scaling every one of them by the same ratio — changing `scale` on its own
  // leaves the joint anchor at the old size, so the strap stops meeting the
  // card's clip and visibly detaches.
  //
  // On mobile the card is sized to one third of the viewport BREADTH and the
  // height follows automatically (the mesh scales uniformly, so the vertical
  // rectangle keeps its aspect ratio). `viewport.width` is in world units and
  // already accounts for the canvas aspect, so this adapts to any phone width.
  const cardScale = isMobile ? ((1 / 3) * viewport.width) / cardUnitWidth : 6.8;
  const k = cardScale / 2.25;

  // Mobile: derive the rope length so the card lands in the free space below
  // the CTA, instead of a fixed length that only suits one phone size. The
  // card's own scaled offsets (1.5k spherical joint + 1.2k mesh offset) already
  // carry a two-thirds-width card a long way down, so the rope only makes up
  // the remainder; clamped so the strap can never collapse to nothing.
  const targetCentreFraction = 0.78;
  const effectiveRope = isMobile
    ? Math.max(0.45, (targetCentreFraction * viewport.height - 0.2 - 2.7 * k) / 3)
    : ropeLength;

  const getLerped = (body: LanyardRigidBody): THREE.Vector3 => {
    if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
    return body.lerped;
  };

  // Bake our brand card art into both UV halves of the model's texture atlas.
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    const baseImg = baseMap.image as HTMLImageElement;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseMap;
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img: HTMLImageElement, rect: typeof FRONT_UV_RECT) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const scale = Math.max(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (faceTexture.image) {
      drawFitted(faceTexture.image as HTMLImageElement, FRONT_UV_RECT);
      drawFitted(faceTexture.image as HTMLImageElement, BACK_UV_RECT);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [faceTexture, materials.base.map]);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [
    [0, 0, 0],
    [0, 0, 0],
    effectiveRope,
  ]);
  useRopeJoint(j1, j2, [
    [0, 0, 0],
    [0, 0, 0],
    effectiveRope,
  ]);
  useRopeJoint(j2, j3, [
    [0, 0, 0],
    [0, 0, 0],
    effectiveRope,
  ]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5 * k, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      gl.domElement.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        gl.domElement.style.cursor = "auto";
      };
    }
  }, [hovered, dragged, gl]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      const tx = vec.x - dragged.x;
      const ty = vec.y - dragged.y;
      const tz = vec.z - dragged.z;
      card.current?.setNextKinematicTranslation({ x: tx, y: ty, z: tz });

      // Measure how fast the gesture is actually moving the card, so the
      // throw can be handed to the solver the moment the pointer is released.
      const dt = Math.max(delta, 1 / 120);
      if (lastDragPos.current) {
        dragVel.current.set(
          (tx - lastDragPos.current.x) / dt,
          (ty - lastDragPos.current.y) / dt,
          (tz - lastDragPos.current.z) / dt
        );
      } else {
        lastDragPos.current = new THREE.Vector3();
      }
      lastDragPos.current.set(tx, ty, tz);
    }

    // Applied here rather than in the pointer handler: the body only becomes
    // dynamic after the re-render, and setting velocity on a still-kinematic
    // body is discarded. Clamped so a fast flick can't fling it off-screen.
    if (!dragged && releaseVel.current && card.current) {
      const v = releaseVel.current.clampLength(0, 28);
      card.current.setLinvel({ x: v.x, y: v.y, z: v.z }, true);
      releaseVel.current = null;
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const lerped = getLerped(ref.current);
        const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current.translation())));
        lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(getLerped(j2.current));
      curve.points[2].copy(getLerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = "chordal";

  return (
    <>
      {/* The segments start already hanging vertically at their rest position,
          rather than strung out horizontally as in the upstream demo. That demo
          relied on very heavy damping to kill the resulting dramatic drop; now
          that damping is low enough to give a lively swing, the same horizontal
          start would flail on every page load. Starting at rest means the
          entrance is calm and the springiness is spent on real interaction. */}
      <group position={[anchorX, anchorY, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0, -effectiveRope, 0]} ref={j1} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -2 * effectiveRope, 0]} ref={j2} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -3 * effectiveRope, 0]} ref={j3} {...segmentProps} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[0, -3 * effectiveRope - 1.5 * k, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8 * k, 1.125 * k, 0.01]} />
          <group
            scale={cardScale}
            position={[0, -1.2 * k, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId);
              // Hand the gesture's momentum to the physics body so the card
              // flies out of the throw and swings back, instead of resuming
              // from a standstill.
              releaseVel.current = dragVel.current.clone();
              lastDragPos.current = null;
              dragVel.current.set(0, 0, 0);
              drag(false);
            }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId);
              lastDragPos.current = null;
              dragVel.current.set(0, 0, 0);
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current!.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      {/* frustumCulled={false} is required: this geometry is rebuilt every
          frame via setPoints(), but its bounding sphere is never recomputed,
          so three.js culls the entire strap as soon as the stale sphere
          leaves the frustum — the strap silently disappears. */}
      <mesh ref={band} frustumCulled={false}>
        <meshLineGeometry />
        {/* Plain solid strap — no texture, image or logo on the thread. */}
        {/* Strap width is deliberately narrower than a proportional scale-up:
            0.62 of it, so the band reads roughly the same width as the card's
            metal clip rather than a wide ribbon. Still derived from `k`, so it
            stays in proportion when the card is resized. */}
        <meshLineMaterial
          color="#1a1a1a"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          lineWidth={0.42 * k}
        />
      </mesh>
    </>
  );
}
