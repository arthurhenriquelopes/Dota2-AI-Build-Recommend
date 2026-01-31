import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Hero, HEROES } from "../data/heroes";

interface HeroSelectProps {
    label?: string;
    selectedHero: Hero | undefined;
    onSelect: (hero: Hero) => void;
    excludeHeroes?: Hero[];
}

export const HeroSelect: React.FC<HeroSelectProps> = ({
    label,
    selectedHero,
    onSelect,
    excludeHeroes = [],
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filteredHeroes = HEROES.filter(
        (hero) =>
            hero.localized_name.toLowerCase().includes(query.toLowerCase()) &&
            !excludeHeroes.find((h) => h.id === hero.id)
    );

    const getHeroIconUrl = (name: string) => {
        // Sanitize name for CDN: remove apostrophes.
        const cleanName = name.replace(/'/g, "");
        return `https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/${cleanName}.png`;
    };

    return (
        <div className="relative w-full">
            {label && <label className="block text-xs font-medium mb-1 text-slate-400 uppercase tracking-wider">{label}</label>}
            <div
                className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm bg-slate-800 border rounded-lg cursor-pointer transition-all group",
                    open ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-slate-700 hover:border-slate-600 hover:bg-slate-750"
                )}
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedHero ? (
                        <>
                            <img
                                src={getHeroIconUrl(selectedHero.name)}
                                alt={selectedHero.localized_name}
                                className="w-12 h-7 object-cover rounded shadow-sm shrink-0 bg-slate-950"
                            />
                            <span className="text-slate-100 font-medium truncate">{selectedHero.localized_name}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-7 bg-slate-700/50 rounded animate-pulse shrink-0" />
                            <span className="text-slate-500 italic">Select hero...</span>
                        </>
                    )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <input
                        type="text"
                        className="w-full px-3 py-2 text-sm bg-slate-900 border-b border-slate-700 focus:outline-none text-white placeholder-slate-500"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {filteredHeroes.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-slate-500 text-center">No heroes found.</li>
                        ) : (
                            filteredHeroes.map((hero) => (
                                <li
                                    key={hero.id}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors border-l-2 border-transparent",
                                        selectedHero?.id === hero.id
                                            ? "bg-slate-700/50 text-emerald-400 border-emerald-500"
                                            : "text-slate-200 hover:bg-slate-700 hover:text-white"
                                    )}
                                    onClick={() => {
                                        onSelect(hero);
                                        setOpen(false);
                                        setQuery("");
                                    }}
                                >
                                    <img
                                        src={getHeroIconUrl(hero.name)}
                                        alt={hero.localized_name}
                                        className="w-10 h-6 object-cover rounded shadow-sm bg-slate-900"
                                        loading="lazy"
                                    />
                                    <span>{hero.localized_name}</span>
                                    {selectedHero?.id === hero.id && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
