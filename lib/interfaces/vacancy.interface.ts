export interface VacancyDTO {
    id: string;
    title: string;
    description: string | null;
    company?: string | null;
    modality?: string | null;
    level?: string | null;
    technologies: string[];
    link?: string | null;
    origin?: string | null;
    location?: string | null;
    salary?: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    matches: number | null;
    score: number | null
}

export interface CreateVacancyData {
    title: string;
    description: string;
    company: string;
    modality: string;
    level: string;
    technologies: string[];
    link: string;
    origin: string;
    location: string;
    salary: string | null;
    active: boolean;
    // Recrutador que cadastrou a vaga (vazio quando foi o admin)
    createdById?: string | null;
}