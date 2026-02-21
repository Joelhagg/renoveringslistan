import Link from "next/link";

export default function Home() {
    return (
        <main className="max-w-2xl mx-auto p-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h1 className="text-2xl text-black font-semibold">Renoveringslistan 🛠️🏠</h1>
                <p className="mt-2 text-sm text-black">
                    Skapa renoveringsprojekt, fyll på med detaljer och skapa checklistor för att hålla koll på allt som behöver göras. Enkelt, snabbt och gratis!
                </p>
                <Link href="/projects" className="inline-block mt-4 rounded-lg bg-black px-4 py-2 text-white">Gå till projekt →</Link>
                <p className="mt-6 text-xs text-black">*Demo: Data sparas per webbläsare med ett lokalt id. Kvoter stoppar för många projekt och checklistor. Spara inte känslig data!</p>
            </div>
        </main> 
    )
}