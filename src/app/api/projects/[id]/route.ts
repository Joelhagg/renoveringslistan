import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId")?.trim();
    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });

    const sb = supabaseAdmin();
    const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("client_id", clientId)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    for (const k of ["title", "owner", "notes", "start_date", "end_date"]) {
        if (body[k] !== undefined) patch[k] = body[k];
    }
    patch.updated_at = new Date().toISOString();

    const sb = supabaseAdmin();
    const { data, error } = await sb
        .from("projects")
        .update(patch)
        .eq("id", id)
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
    if (!clientId) return NextResponse.json({ error: "ClientId required" }, { status: 400 });

    const sb = supabaseAdmin();
    
    // Delete all checklist items first (cascade delete)
    await sb
        .from("checklist_items")
        .delete()
        .eq("project_id", id)
        .eq("client_id", clientId);

    // Then delete the project
    const { error } = await sb
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("client_id", clientId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
