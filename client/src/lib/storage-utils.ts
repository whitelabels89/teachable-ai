import { Project, Achievement, UserProgress } from "@shared/schema";

const STORAGE_KEYS = {
  PROJECTS: 'ai-lab-projects',
  ACHIEVEMENTS: 'ai-lab-achievements',
  USER_PROGRESS: 'ai-lab-progress'
};

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-project',
    title: 'Peneliti Pemula',
    description: 'Selesaikan proyek pertama',
    icon: '🥇',
    unlocked: false,
    criteria: { type: 'projects_completed', value: 1 }
  },
  {
    id: 'accuracy-master',
    title: 'Penembak Jitu',
    description: 'Capai akurasi 90%',
    icon: '🎯',
    unlocked: false,
    criteria: { type: 'accuracy_achieved', value: 0.9 }
  },
  {
    id: 'master-ai',
    title: 'Master AI',
    description: 'Selesaikan 10 proyek',
    icon: '🏆',
    unlocked: false,
    criteria: { type: 'projects_completed', value: 10 }
  },
  {
    id: 'class-creator',
    title: 'Kreator Kelas',
    description: 'Buat 50 kelas berbeda',
    icon: '🎨',
    unlocked: false,
    criteria: { type: 'classes_created', value: 50 }
  }
];

// Default user progress
const DEFAULT_USER_PROGRESS: UserProgress = {
  projectsCompleted: 0,
  highestAccuracy: 0,
  totalClasses: 0,
  badges: [],
  currentStreak: 0,
  lastActivity: Date.now()
};

export async function saveProject(project: Project): Promise<Project> {
  try {
    const projects = await getProjects();
    const newProject = {
      ...project,
      id: project.id || `project-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedProjects = [...projects, newProject];
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    
    // Update user progress
    await updateUserProgress(newProject);
    
    return newProject;
  } catch (error) {
    console.error('Error saving project:', error);
    throw new Error('Failed to save project');
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const projects = await getProjects();
    return projects.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    const updatedProject = {
      ...projects[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    projects[index] = updatedProject;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return stored ? JSON.parse(stored) : DEFAULT_ACHIEVEMENTS;
  } catch (error) {
    console.error('Error loading achievements:', error);
    return DEFAULT_ACHIEVEMENTS;
  }
}

export async function updateAchievements(achievements: Achievement[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    console.error('Error updating achievements:', error);
  }
}

export async function getUserProgress(): Promise<UserProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    return stored ? JSON.parse(stored) : DEFAULT_USER_PROGRESS;
  } catch (error) {
    console.error('Error loading user progress:', error);
    return DEFAULT_USER_PROGRESS;
  }
}

export async function updateUserProgress(project?: Project): Promise<void> {
  try {
    const progress = await getUserProgress();
    const projects = await getProjects();
    
    // Update progress based on projects
    progress.projectsCompleted = projects.filter(p => p.model.trained).length;
    progress.totalClasses = projects.reduce((sum, p) => sum + p.classes.length, 0);
    progress.highestAccuracy = Math.max(
      progress.highestAccuracy,
      ...projects.map(p => p.model.accuracy || 0)
    );
    progress.lastActivity = Date.now();
    
    // Check for new achievements
    const achievements = await getAchievements();
    const newAchievements = achievements.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let shouldUnlock = false;
      switch (achievement.criteria.type) {
        case 'projects_completed':
          shouldUnlock = progress.projectsCompleted >= achievement.criteria.value;
          break;
        case 'accuracy_achieved':
          shouldUnlock = progress.highestAccuracy >= achievement.criteria.value;
          break;
        case 'classes_created':
          shouldUnlock = progress.totalClasses >= achievement.criteria.value;
          break;
      }
      
      if (shouldUnlock) {
        progress.badges.push(achievement.id);
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now()
        };
      }
      
      return achievement;
    });
    
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
    await updateAchievements(newAchievements);
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
}

export async function exportProject(id: string): Promise<string> {
  try {
    const project = await getProject(id);
    if (!project) throw new Error('Project not found');
    
    const exportData = {
      project,
      exportedAt: Date.now(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting project:', error);
    throw new Error('Failed to export project');
  }
}

export async function importProject(data: string): Promise<Project> {
  try {
    const importData = JSON.parse(data);
    const project = importData.project;
    
    // Generate new ID to avoid conflicts
    project.id = `imported-${Date.now()}`;
    project.createdAt = Date.now();
    project.updatedAt = Date.now();
    
    return await saveProject(project);
  } catch (error) {
    console.error('Error importing project:', error);
    throw new Error('Failed to import project');
  }
}
