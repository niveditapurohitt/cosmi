import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

export default function CameraRig({ dnaLength }) {
    const scroll = useScroll();

    useFrame((state) => {
        // scroll.offset goes from 0 to 1
        const targetX = scroll.offset * dnaLength - (dnaLength / 2);

        // Smoothly animate the camera along the X axis
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);

        // Fix the camera on the Z axis (viewing from the side) and Y axis (centered vertically)
        // You can increase or decrease 15 to zoom in or out
        state.camera.position.z = 15;
        state.camera.position.y = 0;

        // Look straight ahead at the current X position, NOT down the barrel
        state.camera.lookAt(targetX, 0, 0);
    });

    return null;
}