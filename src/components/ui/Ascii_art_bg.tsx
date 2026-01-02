import React, { useRef, useEffect } from 'react';

// --- I. Configuration & Palette ---

const GRID_SIZE = 40; // 40x40 logical grid
const CELL_SIZE = 12; // Size of one "stitch" in pixels
const ANIMATION_DURATION = 4000; // 4 seconds
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const PALETTE = {
  BG: '#000000',
  PURPLE: '#5D2F6D', // Stems - Pattern: "X"
  PINK: '#E75480',   // Main Petals - Pattern: Solid
  PEACH: '#FFA07A',  // Highlights - Pattern: Solid
  INDIGO: '#2E1A47', // Shadows - Pattern: "X"
};

// --- II. Types ---

type PixelType = 'stem' | 'petal' | 'center';

interface Pixel {
  id: number;
  baseX: number; // Original Grid X
  baseY: number; // Original Grid Y
  color: string;
  type: PixelType;
  flowerCenter?: { x: number; y: number }; // Which center it belongs to (for expansion)
}

// --- III. Data Generation (The Art) ---

const generatePixels = (): Pixel[] => {
  const pixels: Pixel[] = [];
  let idCounter = 0;

  const addPixel = (x: number, y: number, color: string, type: PixelType, centerX?: number, centerY?: number) => {
    pixels.push({
      id: idCounter++,
      baseX: x,
      baseY: y,
      color,
      type,
      flowerCenter: centerX !== undefined ? { x: centerX, y: centerY } : undefined,
    });
  };

  // 1. LEFT FLOWER (Center approx 10, 20)
  const leftCX = 10;
  const leftCY = 20;

  // Left Stem (Static)
  for (let y = leftCY + 3; y < GRID_SIZE; y++) {
    // Zig-zaggy stem
    const offset = y % 2 === 0 ? 0 : 1;
    addPixel(leftCX + offset, y, PALETTE.PURPLE, 'stem');
  }

  // Left Bud (Dynamic)
  // Create a 5x5 cluster for the bud
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const dist = Math.sqrt(x * x + y * y);
      if (dist > 2.5) continue; // Make it circular

      let color = PALETTE.PINK;
      if (dist > 1.5) color = PALETTE.PEACH; // Outer edges are peach
      if (x === 0 && y === 0) color = PALETTE.INDIGO; // Center is dark

      addPixel(leftCX + x, leftCY + y, color, 'petal', leftCX, leftCY);
    }
  }

  // 2. RIGHT FLOWER (Center approx 30, 10)
  const rightCX = 30;
  const rightCY = 10;

  // Right Stem (Tall, vertical)
  for (let y = rightCY + 2; y < GRID_SIZE; y++) {
    addPixel(rightCX, y, PALETTE.PURPLE, 'stem');
  }

  // Right Bud (Small, Tulipy)
  // 3x3 small cluster
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
        let color = PALETTE.PINK;
        if (y === -1) color = PALETTE.PEACH; // Top is peach

        addPixel(rightCX + x, rightCY + y, color, 'petal', rightCX, rightCY);
    }
  }

  return pixels;
};

// --- IV. The Component ---

const CrossStitchBloom: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = generatePixels();

    // Helper: Draw Cross Stitch "X"
    const drawX = (cx: number, cy: number, color: string, scale: number) => {
        const size = CELL_SIZE * scale; // Scale the pixel size slightly for effect
        const x = cx - size / 2;
        const y = cy - size / 2;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + size - 2, y + size - 2);
        ctx.moveTo(x + size - 2, y + 2);
        ctx.lineTo(x + 2, y + size - 2);
        ctx.stroke();
    };

    // Helper: Draw Solid Rounded Square
    const drawSolid = (cx: number, cy: number, color: string, scale: number) => {
        const size = (CELL_SIZE - 2) * scale; // -2 for gap between stitches
        const x = cx - size / 2;
        const y = cy - size / 2;
        
        ctx.fillStyle = color;
        // Simple approximation of rounded rect for canvas compatibility
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 2); 
        ctx.fill();
    };

    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      
      // Calculate Animation Progress (0.0 to 1.0), looping
      let progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;
      
      // Optional: Add a pause at the end (Full Bloom)
      if (progress > 0.9) progress = 1; 

      // Clear Canvas
      ctx.fillStyle = PALETTE.BG;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Render Pixels
      pixels.forEach((p) => {
        let currentX = p.baseX;
        let currentY = p.baseY;

        // --- EXPANSION LOGIC ---
        // Formula: NewPos = Center + (OriginalVector * ExpansionFactor)
        if (p.type === 'petal' && p.flowerCenter) {
           const vecX = p.baseX - p.flowerCenter.x;
           const vecY = p.baseY - p.flowerCenter.y;
           
           // Expansion curve: Starts slow, speeds up
           const expansionFactor = 1 + (progress * 2.5); // Expands up to 2.5x distance
           
           currentX = p.flowerCenter.x + (vecX * expansionFactor);
           currentY = p.flowerCenter.y + (vecY * expansionFactor);
           
           // Add "Float" effect to Peach highlights (outer petals)
           if (p.color === PALETTE.PEACH) {
             currentY -= progress * 2; // Float upwards slightly
           }
        }

        // Convert Grid Coordinates to Canvas Pixels
        const canvasX = currentX * CELL_SIZE + (CELL_SIZE / 2);
        const canvasY = currentY * CELL_SIZE + (CELL_SIZE / 2);

        // --- TEXTURE MAPPING ---
        // Dark colors (Stems/Indigo) = "X" pattern
        // Light colors (Pink/Peach) = Solid pattern
        if (p.color === PALETTE.PURPLE || p.color === PALETTE.INDIGO) {
            drawX(canvasX, canvasY, p.color, 1);
        } else {
            drawSolid(canvasX, canvasY, p.color, 1);
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#111', 
      padding: '20px',
      borderRadius: '8px'
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: '400px', // Responsive display size
          height: '400px',
          imageRendering: 'pixelated', // Keep edges sharp
          border: '1px solid #333'
        }}
      />
    </div>
  );
};

export default CrossStitchBloom;