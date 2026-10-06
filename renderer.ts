export const RATIOS = ["9:16", "16:9", "3:4", "1:1"] as const;
export type Ratio = typeof RATIOS[number];

export interface RenderOpts {
  image: HTMLImageElement;
  ratio: Ratio;
  song: string;
  artist: string;
  color: string;
  current: string;
  total: string;
}

export function validateImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error("Image size must be <= 15MB"));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          return reject(new Error("Image dimensions must be at least 300x300px"));
        }
        resolve(img);
      };
      img.onerror = () => reject(new Error("Failed to load image file"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#ef4444";
  canvas.width = 50;
  canvas.height = 50;
  ctx.drawImage(img, 0, 0, 50, 50);
  const data = ctx.getImageData(0, 0, 50, 50).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    r += data[i];
    g += data[i+1];
    b += data[i+2];
    count++;
  }
  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getDimensions(ratio: Ratio): { width: number; height: number } {
  switch (ratio) {
    case "9:16": return { width: 1080, height: 1920 };
    case "16:9": return { width: 1920, height: 1080 };
    case "3:4": return { width: 1200, height: 1600 };
    case "1:1": return { width: 1200, height: 1200 };
  }
}

export function renderArtwork(canvas: HTMLCanvasElement, opts: RenderOpts) {
  const { width, height } = getDimensions(opts.ratio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background blur / cover
  ctx.save();
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, width, height);

  // Draw background blurred image or dimmed cover
  ctx.filter = "blur(40px) brightness(0.4)";
  ctx.drawImage(opts.image, -100, -100, width + 200, height + 200);
  ctx.restore();

  // Vignette overlay
  const grad = ctx.createRadialGradient(width/2, height/2, width*0.2, width/2, height/2, width*0.8);
  grad.addColorStop(0, "rgba(0,0,0,0.2)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Card bounding box layout depending on aspect ratio
  const isPortrait = height > width;
  const cardSize = isPortrait ? width * 0.82 : height * 0.72;
  const x = (width - cardSize) / 2;
  const y = (height - cardSize) / (isPortrait ? 2.6 : 2);

  // Glow shadow
  ctx.save();
  ctx.shadowColor = opts.color;
  ctx.shadowBlur = 60;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Card background
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  const radius = 36;
  ctx.roundRect(x, y, cardSize, cardSize, radius);
  ctx.fill();
  ctx.restore();

  // Card border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner Artwork
  const padding = cardSize * 0.08;
  const imgSize = cardSize - padding * 2;
  const imgY = y + padding;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + padding, imgY, imgSize, imgSize * 0.75, 20);
  ctx.clip();
  ctx.drawImage(opts.image, x + padding, imgY, imgSize, imgSize * 0.75);
  ctx.restore();

  // Text & Spotify Player details below artwork
  const textY = imgY + imgSize * 0.75 + 45;
  
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.floor(cardSize * 0.055)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(opts.song || "TRACK TITLE", x + padding, textY);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = `500 ${Math.floor(cardSize * 0.038)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(opts.artist || "ARTIST NAME", x + padding, textY + 42);

  // Progress bar
  const barY = textY + 80;
  const barW = imgSize;
  const barH = 8;

  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.roundRect(x + padding, barY, barW, barH, 4);
  ctx.fill();

  ctx.fillStyle = opts.color;
  ctx.beginPath();
  ctx.roundRect(x + padding, barY, barW * 0.35, barH, 4);
  ctx.fill();

  // Times
  ctx.fillStyle = "#71717a";
  ctx.font = `500 ${Math.floor(cardSize * 0.028)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(opts.current || "0:26", x + padding, barY + 32);
  
  const totalW = ctx.measureText(opts.total || "1:26").width;
  ctx.fillText(opts.total || "1:26", x + padding + barW - totalW, barY + 32);
}

export async function exportArtwork(opts: RenderOpts): Promise<Blob> {
  const canvas = document.createElement("canvas");
  renderArtwork(canvas, opts);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
  });
}