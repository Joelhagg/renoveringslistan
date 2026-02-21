"use client";

import { getClientId } from "@/lib/clientId";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type Project = {
    id: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
    owner: string | null;
    notes: string | null;
}

type ChecklistItem = {
    id: string;
    text: string;
    is_done: boolean;
}

export default function ProjectDetailClient({ projectId }: Readonly<{ projectId: string }>) {
    const router = useRouter();
    const [clientId, setClientId] = useState("");
    const [project, setProject] = useState<Project | null>(null);
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newRowText, setNewRowText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition(); 

    useEffect(() => {
        const id = getClientId();
        setClientId(id);
        loadAll(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    async function loadAll(id: string) {
        setError(null);

        const pRes = await fetch(`/api/projects/${projectId}?clientId=${encodeURIComponent(id)}`);
        const pData = await pRes.json();
        if (!pRes.ok) return setError(pData.error ?? "Kunde inte ladda projektet");
        setProject(pData);

        const cRes = await fetch(`/api/projects/${projectId}/checklist?clientId=${encodeURIComponent(id)}`);
        const cData = await cRes.json();
        if (!cRes.ok) return setError(cData.error ?? "Kunde inte ladda checklistan");
        setItems(cData);
    }

    const doneCount = useMemo(() => items.filter((x) => x.is_done).length, [items]);

    function patchProject(patch: Partial<Project>) {
        if (!clientId) return;
        startTransition(async () => {
            setError(null);
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ clientId, ...patch }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte uppdatera projektet");
            setProject(data);
        });
    }

    function toggleItem(itemId: string, is_done: boolean) {
        if (!clientId) return;
        startTransition(async () => {
            const res = await fetch(`/api/projects/${projectId}/checklist`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ clientId, itemId, is_done }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte uppdatera checklistan");
            setItems((cur) => cur.map((x) => x.id === itemId ? data : x));
        });
    }

    function addChecklistRow(e: React.SyntheticEvent) {
        e.preventDefault();
        const text = newRowText.trim();
        if (!text || !clientId) return;

        startTransition(async () => {
            setError(null);
            const res = await fetch(`/api/projects/${projectId}/checklist`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ clientId, text }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte lägga till checklist item");
            setItems((prev) => [...prev, data]);
            setNewRowText("");
        });
    }

    function deleteProject() {
        if (!clientId || !confirm("Är du säker på att du vill ta bort detta projekt?")) return;
        
        startTransition(async () => {
            setError(null);
            const res = await fetch(`/api/projects/${projectId}?clientId=${encodeURIComponent(clientId)}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte ta bort projektet");
            router.push("/projects");
        });
    }

    function deleteItem(itemId: string) {
        if (!clientId || !confirm("Är du säker på att du vill ta bort denna punkt?")) return;
        
        startTransition(async () => {
            setError(null);
            const res = await fetch(`/api/projects/${projectId}/checklist?clientId=${encodeURIComponent(clientId)}&itemId=${itemId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error ?? "Kunde inte ta bort checklist item");
            setItems((cur) => cur.filter((x) => x.id !== itemId));
        });
    }

    if (!project) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg text-black font-semibold">Laddar...</h2>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <Link href="/projects" className="text-sm text-black underline">← Tillbaka</Link>

                <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl text-black font-semibold">{project.title}</h1>
                        <p className="mt-1 text-sm text-black">Checklista: {doneCount} / {items.length} klara</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {isPending && <span className="text-sm text-black">Sparar...</span>}
                        <button 
                            onClick={deleteProject}
                            disabled={isPending}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                            title="Ta bort projekt"
                        >
                            🗑️ Ta bort
                        </button>
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-6 grid gap-4">
                    <label className="grid gap-1">
                        <span className="text-sm text-black font-medium">Rubrik</span>
                        <input
                            className="rounded-lg border px-3 py-2 text-black"
                            value={project.title}
                            onChange={(e) => setProject({ ...project, title: e.target.value })}
                            onBlur={() => patchProject({ title: project.title })}
                        />
                    </label>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="grid gap-1">
                            <span className="text-sm text-black font-medium">Startdatum</span>
                            <input 
                                type="date"
                                className="rounded-lg border px-3 py-2 text-black"
                                value={project.start_date ?? ""}
                                onChange={(e) => setProject({ ...project, start_date: e.target.value })}
                                onBlur={() => patchProject({ start_date: project.start_date })}
                            />
                        </label>

                        <label className="grid gap-1">
                            <span className="text-sm text-black font-medium">Slutdatum</span>
                            <input 
                                type="date"
                                className="rounded-lg border px-3 py-2 text-black"
                                value={project.end_date ?? ""}
                                onChange={(e) => setProject({ ...project, end_date: e.target.value })}
                                onBlur={() => patchProject({ end_date: project.end_date })}
                            />
                        </label>
                    </div>

                    <label className="grid gap-1">
                        <span className="text-sm text-black font-medium">Ansvarig</span>
                        <input
                            className="rounded-lg border px-3 py-2 text-black placeholder:text-gray-400"
                            placeholder="Vem är ansvarig för projektet?"
                            value={project.owner ?? ""}
                            onChange={(e) => setProject({ ...project, owner: e.target.value })}
                            onBlur={() => patchProject({ owner: project.owner })}
                        />
                    </label>

                    <label className="grid gap-1">
                        <span className="text-sm text-black font-medium">Anteckningar</span>
                        <textarea
                            className="rounded-lg border px-3 py-2 text-black placeholder:text-gray-400"
                            rows={5}
                            placeholder="Skriv dina anteckningar här..."
                            value={project.notes ?? ""}
                            onChange={(e) => setProject({ ...project, notes: e.target.value })}
                            onBlur={() => patchProject({ notes: project.notes })}
                        />
                    </label>
                </div>

                <div className="mt-8">
                    <h2 className="text-lg text-black font-semibold">Checklista</h2>

                    <ul className="mt-3 grid gap-2">
                        {items.map((it) => (
                            <li key={it.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                                <input 
                                    type="checkbox"
                                    checked={it.is_done}
                                    onChange={(e) => toggleItem(it.id, e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <span className={it.is_done ? "line-through text-gray-400 flex-1" : "text-black flex-1"}>{it.text}</span>
                                <button
                                    onClick={() => deleteItem(it.id)}
                                    disabled={isPending}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm"
                                    title="Ta bort"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                                
                    </ul>

                    <form onSubmit={addChecklistRow} className="mt-4 flex gap-2">
                        <input 
                            className="w-full rounded-lg border px-3 py-2 text-black placeholder:text-black"
                            placeholder="Ny punkt... (tryck Enter)"
                            value={newRowText}
                            onChange={(e) => setNewRowText(e.target.value)}
                        />
                        <button 
                            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isPending || !newRowText.trim()}
                            >
                                Lägg till
                        </button>
                    </form>

                    <p className="mt-2 text-xs text-black">
                        När du fyller i en punkt och trycker Enter dyker en ny tom rad upp automatiskt. 
                    </p>
                </div>

            </div>
        </main>
    );
}