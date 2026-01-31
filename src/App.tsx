import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HeroSelect } from "./components/HeroSelect";
import { Hero } from "./data/heroes";
import { cn } from "./lib/utils";

// Types for Rust communication
interface BuildRecommendation {
  item_build: { item_name: string; reasoning: string; icon_url?: string }[];
  reasoning: string;
}

function App() {
  const [userHero, setUserHero] = useState<Hero | undefined>();
  const [allies, setAllies] = useState<(Hero | undefined)[]>([undefined, undefined, undefined, undefined]);
  const [enemies, setEnemies] = useState<(Hero | undefined)[]>([undefined, undefined, undefined, undefined, undefined]);
  const [position, setPosition] = useState("P1");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<BuildRecommendation | null>(null);

  const handleRecommend = async () => {
    if (!userHero) return;
    setLoading(true);
    try {
      const result = await invoke<BuildRecommendation>("recommend_build", {
        request: {
          user_hero: userHero.localized_name,
          user_position: position,
          allies: allies.filter((h) => h).map((h) => h!.localized_name),
          enemies: enemies.filter((h) => h).map((h) => h!.localized_name),
        },
      });
      setRecommendation(result);
    } catch (e) {
      console.error(e);
      alert("Failed to get recommendation: " + e);
    } finally {
      setLoading(false);
    }
  };

  const updateArray = (setter: React.Dispatch<React.SetStateAction<(Hero | undefined)[]>>, index: number, hero: Hero) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = hero;
      return next;
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col">
      {/* Compact Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
            Dota 2 AI Build
          </h1>
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Powered by Manus AI
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Panel: Controls (Inputs) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-2">

          {/* Section: You */}
          <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">You</h2>
              <div className="flex gap-1">
                {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-all font-mono",
                      position === p
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <HeroSelect
              label=""
              selectedHero={userHero}
              onSelect={setUserHero}
            />
          </section>

          {/* Section: Teams (Grid for compactness) */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {/* Allies */}
            <section className="bg-slate-900/30 p-3 rounded-xl border border-dashed border-slate-800/50 space-y-2">
              <h2 className="text-xs font-bold text-emerald-500/70 uppercase mb-2">Allies</h2>
              <div className="space-y-2">
                {allies.map((hero, i) => (
                  <HeroSelect
                    key={`ally-${i}`}
                    selectedHero={hero}
                    onSelect={(h) => updateArray(setAllies, i, h)}
                    excludeHeroes={[userHero!, ...allies, ...enemies].filter(Boolean) as Hero[]}
                  />
                ))}
              </div>
            </section>

            {/* Enemies */}
            <section className="bg-slate-900/30 p-3 rounded-xl border border-dashed border-red-900/20 space-y-2">
              <h2 className="text-xs font-bold text-red-500/70 uppercase mb-2">Enemies</h2>
              <div className="space-y-2">
                {enemies.map((hero, i) => (
                  <HeroSelect
                    key={`enemy-${i}`}
                    selectedHero={hero}
                    onSelect={(h) => updateArray(setEnemies, i, h)}
                    excludeHeroes={[userHero!, ...allies, ...enemies].filter(Boolean) as Hero[]}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Action */}
          <button
            onClick={handleRecommend}
            disabled={!userHero || loading}
            className={cn(
              "w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all shadow-lg shrink-0 mt-auto",
              !userHero || loading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20"
            )}
          >
            {loading ? "Analyzing Strategy..." : "Recommend Build"}
          </button>
        </div>

        {/* Right Panel: Results (Scrollable if needed, but designed to fit) */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900/50 rounded-xl border border-slate-800 relative flex flex-col h-full overflow-hidden">
          {!recommendation && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
              <div className="text-8xl mb-4 opacity-20 grayscale">🛡️</div>
              <p className="text-lg font-medium">Ready for Battle</p>
              <p className="text-sm">Select heroes to generate strategy</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500/50 animate-pulse">
              <div className="text-6xl mb-4">🔮</div>
              <p className="text-lg font-medium">Consulting the Ancients...</p>
            </div>
          )}

          {recommendation && (
            <div className="flex flex-col h-full p-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-6 shrink-0">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  Strategic Analysis
                </h3>
                <p className="text-slate-300 leading-relaxed text-base bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  {recommendation.reasoning}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-2">
                {recommendation.item_build.map((item, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-start gap-3 hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-slate-950 rounded border border-slate-600 group-hover:border-emerald-500/50 transition-colors flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {item.icon_url ? (
                        <img src={item.icon_url} alt={item.item_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-slate-600 text-center px-1">{item.item_name.substring(0, 2)}</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-400 text-sm">{item.item_name}</h4>
                      <p className="text-slate-400 text-xs mt-0.5 leading-snug">{item.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
