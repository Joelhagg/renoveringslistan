import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

const MAX_CHECKLIST_ITEMS_PER_CLIENT = 50;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId")?.trim();
    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });

    const sb = supabaseAdmin();
    const { data, error } = await sb
        .from("checklist_items")
        .select("*")
        .eq("project_id", id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const sb = supabaseAdmin();

    const { count } = await sb
        .from("checklist_items")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId);

    if ((count ?? 0) >= MAX_CHECKLIST_ITEMS_PER_CLIENT) {
        return NextResponse.json({ error: `Checklist item limit of ${MAX_CHECKLIST_ITEMS_PER_CLIENT} reached` }, { status: 400 });
    }

    const { data, error } = await sb
        .from("checklist_items")
        .insert({ project_id: id, client_id: clientId, text })
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    if (!clientId || !itemId) return NextResponse.json({ error: "ClientId and itemId required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (typeof body.is_done === "boolean") patch.is_done = body.is_done;
    if (typeof body.text === "string") patch.text = body.text.trim();
    patch.updated_at = new Date().toISOString();

    const sb = supabaseAdmin();
    const { data, error } = await sb
        .from("checklist_items")
        .update(patch)
        .eq("id", itemId)
        .eq("project_id", id)
        .eq("client_id", clientId)
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId")?.trim();
    const itemId = url.searchParams.get("itemId")?.trim();
    if (!clientId || !itemId) return NextResponse.json({ error: "ClientId and itemId required" }, { status: 400 });

    const sb = supabaseAdmin();
    const { error } = await sb
        .from("checklist_items")
        .delete()
        .eq("id", itemId)
        .eq("project_id", id)
        .eq("client_id", clientId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
