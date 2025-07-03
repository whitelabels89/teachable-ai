import { z } from "zod";

// Project schema
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(["image", "sound", "pose"]),
  classes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    samples: z.array(z.object({
      id: z.string(),
      type: z.enum(["file", "webcam"]),
      data: z.string(), // base64 encoded
      timestamp: z.number()
    }))
  })),
  model: z.object({
    trained: z.boolean(),
    accuracy: z.number().optional(),
    modelData: z.string().optional() // serialized model
  }),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type Project = z.infer<typeof projectSchema>;
export type InsertProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

// Achievement schema
export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  unlocked: z.boolean(),
  unlockedAt: z.number().optional(),
  criteria: z.object({
    type: z.enum(["projects_completed", "accuracy_achieved", "classes_created"]),
    value: z.number()
  })
});

export type Achievement = z.infer<typeof achievementSchema>;

// User progress schema
export const userProgressSchema = z.object({
  projectsCompleted: z.number(),
  highestAccuracy: z.number(),
  totalClasses: z.number(),
  badges: z.array(z.string()),
  currentStreak: z.number(),
  lastActivity: z.number()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Training progress schema
export const trainingProgressSchema = z.object({
  projectId: z.string(),
  epoch: z.number(),
  totalEpochs: z.number(),
  loss: z.number(),
  accuracy: z.number(),
  isTraining: z.boolean()
});

export type TrainingProgress = z.infer<typeof trainingProgressSchema>;

// User schema for authentication
export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(1),
  password: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Export table definitions for Drizzle (if needed later)
export const users = userSchema;
