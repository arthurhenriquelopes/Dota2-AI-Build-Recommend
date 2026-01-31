import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";
import { HEROES, Hero } from "../data/heroes";

interface HeroSelectProps {
    onSelect: (hero: Hero) => void;
    selectedHero?: Hero;
    label?: string;
    excludeHeroes?: Hero[];
}

export const HeroSelect: React.FC<HeroSelectProps> = ({
    onSelect,
    selectedHero,
    label = "Select Hero",
    excludeHeroes = [],
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filteredHeroes = HEROES.filter((hero) =>
        hero.localized_name.toLowerCase().includes(query.toLowerCase()) &&
        !excludeHeroes.find((h) => h.id === hero.id)
    );

    return (
        <div className="relative w-full max-w-xs">
            {label && <label className="block text-sm font-medium mb-1 text-slate-300">{label}</label>}
            <div
                className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm bg-slate-800 border rounded-md cursor-pointer transition-colors",
                    open ? "border-primary ring-1 ring-primary" : "border-slate-700 hover:border-slate-600"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className={selectedHero ? "text-white" : "text-slate-400"}>
                    {selectedHero ? selectedHero.localized_name : "Select hero..."}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-slate-500" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg">
                    <input
                        type="text"
                        className="w-full px-3 py-2 text-sm bg-slate-900 border-b border-slate-700 focus:outline-none text-white placeholder-slate-500"
                        placeholder="Search hero..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <ul className="max-h-60 overflow-auto py-1">
                        {filteredHeroes.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-slate-500">No heroes found.</li>
                        ) : (
                            filteredHeroes.map((hero) => (
                                <li
                                    key={hero.id}
                                    className={cn(
                                        "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-slate-700 text-slate-200",
                                        selectedHero?.id === hero.id && "bg-slate-700 text-white"
                                    )}
                                    onClick={() => {
                                        onSelect(hero);
                                        setOpen(false);
                                        setQuery("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "w-4 h-4 mr-2",
                                            selectedHero?.id === hero.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {hero.localized_name}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
