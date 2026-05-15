import { 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject,
  type Achievement,
  type UserProgress,
  type TrainingProgress
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  unlockAchievement(id: string): Promise<Achievement | undefined>;
  
  // User progress methods
  getUserProgress(): Promise<UserProgress>;
  updateUserProgress(updates: Partial<UserProgress>): Promise<UserProgress>;
  
  // Training progress methods
  getTrainingProgress(projectId: string): Promise<TrainingProgress | undefined>;
  updateTrainingProgress(projectId: string, progress: Partial<TrainingProgress>): Promise<void>;
  
  // Template methods
  getProjectTemplates(): Promise<Project[]>;
  getProjectTemplate(id: string): Promise<Project | undefined>;
  
  // Statistics methods
  getStatistics(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<string, Project>;
  private achievements: Map<string, Achievement>;
  private userProgress: UserProgress;
  private trainingProgress: Map<string, TrainingProgress>;
  private templates: Map<string, Project>;
  
  private currentUserId: number;
  private currentProjectId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.achievements = new Map();
    this.trainingProgress = new Map();
    this.templates = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    
    // Initialize default user progress
    this.userProgress = {
      projectsCompleted: 0,
      highestAccuracy: 0,
      totalClasses: 0,
      badges: [],
      currentStreak: 0,
      lastActivity: Date.now()
    };
    
    // Initialize default achievements
    this.initializeAchievements();
    this.initializeTemplates();
  }

  private initializeAchievements() {
    const defaultAchievements: Achievement[] = [
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
    
    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeTemplates() {
    const defaultTemplates: Project[] = [
      {
        id: 'template-animals',
        name: 'Pengenal Hewan',
        description: 'Template untuk mengenali hewan-hewan lucu',
        type: 'image',
        classes: [
          { id: 'cat', name: 'Kucing 🐱', samples: [] },
          { id: 'dog', name: 'Anjing 🐶', samples: [] }
        ],
        model: { trained: false },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = Date.now();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = `project-${this.currentProjectId++}`;
    const now = Date.now();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async unlockAchievement(id: string): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const unlocked: Achievement = {
      ...achievement,
      unlocked: true,
      unlockedAt: Date.now()
    };
    this.achievements.set(id, unlocked);
    return unlocked;
  }

  // User progress methods
  async getUserProgress(): Promise<UserProgress> {
    return this.userProgress;
  }

  async updateUserProgress(updates: Partial<UserProgress>): Promise<UserProgress> {
    this.userProgress = {
      ...this.userProgress,
      ...updates,
      lastActivity: Date.now()
    };
    return this.userProgress;
  }

  // Training progress methods
  async getTrainingProgress(projectId: string): Promise<TrainingProgress | undefined> {
    return this.trainingProgress.get(projectId);
  }

  async updateTrainingProgress(projectId: string, progress: Partial<TrainingProgress>): Promise<void> {
    const existing = this.trainingProgress.get(projectId);
    const updated: TrainingProgress = {
      projectId,
      epoch: 0,
      totalEpochs: 50,
      loss: 1.0,
      accuracy: 0,
      isTraining: false,
      ...existing,
      ...progress
    };
    this.trainingProgress.set(projectId, updated);
  }

  // Template methods
  async getProjectTemplates(): Promise<Project[]> {
    return Array.from(this.templates.values());
  }

  async getProjectTemplate(id: string): Promise<Project | undefined> {
    return this.templates.get(id);
  }

  // Statistics methods
  async getStatistics(): Promise<any> {
    const projects = Array.from(this.projects.values());
    const trainedProjects = projects.filter(p => p.model.trained);
    
    return {
      totalProjects: projects.length,
      trainedProjects: trainedProjects.length,
      totalClasses: projects.reduce((sum, p) => sum + p.classes.length, 0),
      totalSamples: projects.reduce((sum, p) => 
        sum + p.classes.reduce((classSum, c) => classSum + c.samples.length, 0), 0),
      averageAccuracy: trainedProjects.length > 0 
        ? trainedProjects.reduce((sum, p) => sum + (p.model.accuracy || 0), 0) / trainedProjects.length
        : 0,
      unlockedAchievements: Array.from(this.achievements.values()).filter(a => a.unlocked).length
    };
  }
}

export const storage = new MemStorage();
