import React, { useState, useRef, useEffect } from "react";
import { RATIOS, Ratio, renderArtwork, exportArtwork, extractDominantColor, validateImage } from "./lib/renderer";
import { Sparkles, Download, Upload, RefreshCw, Sliders, Music } from "lucide-react";

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [song, setSong] = useState<string>("LPHONK DRIFT");
  const [artist, setArtist] = useState<string>("AFK PROD");
  const [color, setColor] = useState<string>("#ef4444");
  const [current, setCurrent] = useState<string>("0:26");
  const [total, setTotal] = useState<string>("1:26");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load default placeholder image on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";
    img.onload = () => {
      setImage(img);
      setImageName("default-artwork.jpg");
      setColor(extractDominantColor(img));
    };
  }, []);

  // Re-render canvas whenever options change
  useEffect(() => {
    if (image && canvasRef.current) {
      renderArtwork(canvasRef.current, {
        image,
        ratio,
        song,
        artist,
        color,
        current,
        total,
      });
    }
  }, [image, ratio, song, artist, color, current, total]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const loadedImg = await validateImage(file);
      setImage(loadedImg);
      setImageName(file.name);
      setColor(extractDominantColor(loadedImg));
    } catch (err: any) {
      setError(err.message || "Failed to load image");
    }
  };

  const handleDownload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const blob = await exportArtwork({
        image,
        ratio,
        song,
        artist,
        color,
        current,
        total,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.toLowerCase().replace(/\s+/g, "-")}-cover.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-red-500">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              LPHONK PROMO & TOOLS
            </h1>
            <p className="text-xs text-zinc-400">Spotify & TikTok Card Generator</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={!image || loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 shadow-lg shadow-red-600/20"
        >
          <Download className="w-4 h-4" />
          {loading ? "Exporting..." : "Download Cover"}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            Track & Visual Settings
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Artwork Image</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-xl p-6 cursor-pointer bg-zinc-950/50 transition group">
              <Upload className="w-8 h-8 text-zinc-400 group-hover:text-red-500 mb-2 transition" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                {imageName ? imageName : "Choose cover art (PNG/JPG)"}
              </span>
              <span className="text-xs text-zinc-500 mt-1">Min 300x300px, up to 15MB</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Ratio Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Format Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={`py-2 rounded-xl text-sm font-semibold border transition ${
                    ratio === r
                      ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Song & Artist */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Song Title</label>
              <input
                type="text"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Artist Name</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Accent Glow Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 bg-transparent rounded-lg cursor-pointer border border-zinc-700"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Current Time</label>
              <input
                type="text"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Total Duration</label>
              <input
                type="text"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[600px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-red-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="w-full flex items-center justify-center overflow-auto max-h-[75vh] p-4">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-2xl shadow-2xl border border-zinc-800" />
          </div>
          <p className="text-xs text-zinc-500 mt-4">Real-time HTML5 Canvas Preview</p>
        </div>
      </main>
    </div>
  );
}