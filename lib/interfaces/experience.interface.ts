// GET
export interface ExperienceDTO {
  id: string;
  name: string;
  seniority: string;
  about: string;
  startDate?: Date | null;
  endDate?: Date | null;
  currentJob: boolean;
  updatedAt?: Date | null;
  userId: string;
}

// POST
export interface CreateExperienceDTO {
  name: string;
  seniority: string;
  about: string;
  startDate?: Date;
  endDate?: Date;
  currentJob: boolean;
  userId: string;
}

// PUT
export interface UpdateExperienceDTO {
  name?: string;
  seniority?: string;
  about?: string;
  startDate?: Date;
  endDate?: Date | null;
  currentJob?: boolean;
}