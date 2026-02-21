import ProjectDetailClient from "./ui/ProjectDetailClient";
import { use } from "react";

export default function ProjectPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = use(params);
    return <ProjectDetailClient projectId={id} />;
}