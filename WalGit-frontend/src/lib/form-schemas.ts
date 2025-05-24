import { z } from "zod";

/**
 * Repository Creation Form Schema
 */
export const repositorySchema = z.object({
  name: z
    .string()
    .min(3, { message: "Repository name must be at least 3 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Repository name can only contain letters, numbers, underscores, and hyphens",
    }),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  addReadme: z.boolean().default(false),
  addGitignore: z.boolean().default(false),
  gitignoreTemplate: z.string().optional(),
  addLicense: z.boolean().default(false),
  licenseType: z.string().optional(),
  defaultBranch: z.string().default("main"),
  template: z.string().optional(),
});

/**
 * Repository Wizard Form Schema
 */
export const repositoryWizardSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Repository name must be at least 3 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Repository name can only contain letters, numbers, underscores, and hyphens",
    }),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  storageSettings: z.enum(["basic", "standard", "premium", "custom"]),
  autoRenew: z.boolean().optional(),
  customStorage: z
    .object({
      size: z.string(),
      duration: z.string(),
    })
    .optional(),
  addReadme: z.boolean().default(true),
  defaultBranch: z.enum(["main", "master", "development", "production"]).default("main"),
  license: z.enum(["none", "mit", "apache", "gpl", "bsd"]).default("mit"),
  gitIgnore: z.enum(["none", "node", "python", "java", "rust", "go"]).default("none"),
  importType: z.enum(["new", "import"]).default("new"),
  importFrom: z.enum(["github", "url", "upload", ""]).optional(),
  repoUrl: z.string().optional(),
  template: z.string().optional(),
});

/**
 * Pull Request Creation Form Schema
 */
export const pullRequestSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  sourceBranch: z.string().min(1, { message: "Source branch is required" }),
  targetBranch: z.string().min(1, { message: "Target branch is required" }),
  isDraft: z.boolean().default(false),
}).refine(data => data.sourceBranch !== data.targetBranch, {
  message: "Source and target branches cannot be the same",
  path: ["sourceBranch"],
});

/**
 * Comment Form Schema
 */
export const commentSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }),
  filePath: z.string().optional(),
  lineNumber: z.number().optional(),
});

/**
 * Review Form Schema
 */
export const reviewSchema = z.object({
  verdict: z.enum(["approve", "request_changes", "comment"]),
  comment: z.string().min(1, { message: "Comment is required" }),
});

// Export types
export type RepositoryFormValues = z.infer<typeof repositorySchema>;
export type RepositoryWizardFormValues = z.infer<typeof repositoryWizardSchema>;
export type PullRequestFormValues = z.infer<typeof pullRequestSchema>;
export type CommentFormValues = z.infer<typeof commentSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;