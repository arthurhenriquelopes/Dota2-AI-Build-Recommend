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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            Dota 2 AI Build Recommend
          </h1>
          <p className="text-slate-400">Powered by Manus AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Context Setup */}
          <div className="lg:col-span-1 space-y-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-emerald-400">Your Hero</h2>
              <HeroSelect
                label="Select your hero"
                selectedHero={userHero}
                onSelect={setUserHero}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-slate-300">Position</label>
                <div className="grid grid-cols-5 gap-2">
                  {["P1", "P2", "P3", "P4", "P5"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={cn(
                        "py-2 text-sm rounded border transition-all",
                        position === p
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-medium text-emerald-400">Allies (4)</h2>
              {allies.map((hero, i) => (
                <HeroSelect
                  key={`ally-${i}`}
                  label={`Ally ${i + 1}`}
                  selectedHero={hero}
                  onSelect={(h) => updateArray(setAllies, i, h)}
                  excludeHeroes={[userHero!, ...allies, ...enemies].filter(Boolean) as Hero[]}
                />
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-medium text-red-400">Enemies (5)</h2>
              {enemies.map((hero, i) => (
                <HeroSelect
                  key={`enemy-${i}`}
                  label={`Enemy ${i + 1}`}
                  selectedHero={hero}
                  onSelect={(h) => updateArray(setEnemies, i, h)}
                  excludeHeroes={[userHero!, ...allies, ...enemies].filter(Boolean) as Hero[]}
                />
              ))}
            </div>

            <button
              onClick={handleRecommend}
              disabled={!userHero || loading}
              className={cn(
                "w-full py-4 rounded-lg font-bold text-lg uppercase tracking-wider transition-all shadow-lg",
                !userHero || loading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50"
              )}
            >
              {loading ? "Analyzing..." : "Recommend Build"}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2 space-y-6">
            {!recommendation && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-12">
                <div className="text-6xl mb-4 opacity-50">🛡️</div>
                <p className="text-xl">Select context and ask AI to recommend a build.</p>
              </div>
            )}

            {recommendation && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white mb-2">AI Strategy</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    {recommendation.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.item_build.map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 flex items-start gap-4 hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-16 h-16 bg-slate-950 rounded border border-slate-600 flex items-center justify-center shrink-0">
                        {item.icon_url ? (
                          <img src={item.icon_url} alt={item.item_name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-2xl">⚔️</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-400 text-lg">{item.item_name}</h4>
                        <p className="text-slate-400 text-sm mt-1">{item.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
