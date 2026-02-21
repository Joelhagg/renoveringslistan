"use client";

export default function ErrorPage({ error }: Readonly<{ error: Error }>) {
    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Något gick fel</h2>
                <p className="mt-2 text-sm text-gray-600">{error.message}</p>
            </div>
        </div>
    );
}