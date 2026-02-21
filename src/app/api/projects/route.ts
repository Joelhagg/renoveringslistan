import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

const MAX_PROJECTS_PER_CLIENT = 10;

export async function GET(req: Request) {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId")?.trim();
    if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

    const sb = supabaseAdmin();
    const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const sb = supabaseAdmin();

    const { count } = await sb
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId);

    if ((count ?? 0) >= MAX_PROJECTS_PER_CLIENT) {
        return NextResponse.json({ error: `Project limit of ${MAX_PROJECTS_PER_CLIENT} reached` }, { status: 400 });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;

    const { data, error } = await sb
        .from("projects")
        .insert({ client_id: clientId, title, start_date: today, updated_at: new Date().toISOString() })
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
