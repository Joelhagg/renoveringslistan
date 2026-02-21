"use client";

import { useEffect, useState, useTransition } from "react";
import { getClientId } from "@/lib/clientId";
import Link from "next/link";

type Project = {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    owner: string | null;
    notes: string | null;
}

export default function ProjectsClient() {
    const [clientId, setClientId] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    
    async function load(id: string) {
        setError(null);
        const res = await fetch(`/api/projects?clientId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) return setError(data.error ?? "Kunde inte ladda projekten");
        setProjects(data);
    }

    useEffect(() => {
        const id = getClientId();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClientId(id);
        load(id);
    }, []);

    function createProject(e: React.SyntheticEvent) {
        e.preventDefault();
        const t = title.trim();
        if (!t || !clientId) return;

        startTransition(async () => {
            setError(null);
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ clientId, title: t }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte skapa projektet");
            setTitle("");
            await load(clientId);
        });
    }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <Link href="/" className="text-sm text-black hover:underline">← Tillbaka</Link>

                <h1 className="text-2xl text-black font-semibold">Renoveringsprojekt</h1>

                <form onSubmit={createProject} className="mt-4 flex gap-2">
                    <input 
                        className="w-full rounded-lg border border-gray-300 text-black px-3 py-2 placeholder:text-black"
                        placeholder='Ex: "Renovera sovrummet"'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <button disabled={isPending} className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {isPending ? "Skapar..." : "Skapa"}
                    </button>
                </form>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-6">
                    {projects.length === 0 ? (
                        <p className="text-sm text-black">Inga projekt än. Börja med att skapa ett!</p>
                    ) : (
                    <h2 className="text-2xl font-semibold text-black">Pågående projekt</h2>
                    )}
                    <ul className="mt-2 divide-y">
                        {projects.map((p) => (
                            <li key={p.id} className="py-3">
                                <Link className="text-xl hover:underline text-black" href={`/projects/${p.id}`}>
                                    {p.title}
                                </Link>
                                <div className="text-sm text-black">
                                    {p.owner ? `Ansvarig: ${p.owner}` : "Ingen ansvarig"}   
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>


                <p className="mt-6 text-xs text-black">*Demo: Data sparas per webbläsare med ett lokalt clientId. Kvoter stoppar för många projekt och checklistor. Spara inte känslig data!</p>

            </div>
        </main>
    );
}