import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.APP_BASE_URL || "https://skillhunt.vercel.app";

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "SkillHunt API",
      version: "1.0.0",
      description:
        "REST API for the SkillHunt platform — discover, publish, review, and request Agent Skills.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/skills": {
        get: {
          summary: "Search and browse skills",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["trending", "top-reviewed", "newest", "recently-updated", "most-upvoted"] } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
          ],
          responses: { "200": { description: "List of skills" } },
        },
        post: {
          summary: "Publish a new skill (requires auth)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["skillMd", "displayName", "summary", "categorySlug"],
                  properties: {
                    skillMd: { type: "string" },
                    displayName: { type: "string" },
                    summary: { type: "string" },
                    categorySlug: { type: "string" },
                    version: { type: "string", default: "1.0.0" },
                    changelog: { type: "string" },
                    repoUrl: { type: "string" },
                    homepageUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Published skill" } },
        },
      },
      "/api/skills/{slug}": {
        get: {
          summary: "Get skill details",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Skill detail" } },
        },
      },
      "/api/skills/{slug}/files": {
        get: {
          summary: "Get skill files",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Skill files" } },
        },
      },
      "/api/skills/{slug}/versions": {
        get: {
          summary: "Get skill version history",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Version list" } },
        },
      },
      "/api/skills/{slug}/upvote": {
        post: {
          summary: "Toggle upvote on a skill (requires auth)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Vote toggled" } },
        },
      },
      "/api/skills/{slug}/reviews": {
        post: {
          summary: "Post a review (requires auth)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["rating", "body"],
                  properties: {
                    rating: { type: "integer", minimum: 1, maximum: 5 },
                    headline: { type: "string" },
                    body: { type: "string", minLength: 60 },
                    versionLabelUsed: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Review posted" } },
        },
      },
      "/api/skills/validate": {
        post: {
          summary: "Validate a SKILL.md bundle",
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", required: ["skillMd"], properties: { skillMd: { type: "string" } } },
              },
            },
          },
          responses: { "200": { description: "Validation result" } },
        },
      },
      "/api/categories": {
        get: { summary: "List all categories", responses: { "200": { description: "Category list" } } },
      },
      "/api/tags": {
        get: { summary: "List all tags", responses: { "200": { description: "Tag list" } } },
      },
      "/api/requests": {
        get: {
          summary: "Search requests",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "sort", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Request list" } },
        },
        post: {
          summary: "Create a request (requires auth)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Request created" } },
        },
      },
      "/api/requests/{id}": {
        get: {
          summary: "Get request details",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Request detail" } },
        },
      },
      "/api/profiles/{handle}": {
        get: {
          summary: "Get profile",
          parameters: [{ name: "handle", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Profile" } },
        },
      },
      "/api/agents/register": {
        post: {
          summary: "Register a new agent",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["displayName", "requestedHandle", "publicKey"],
                  properties: {
                    displayName: { type: "string" },
                    description: { type: "string" },
                    requestedHandle: { type: "string" },
                    publicKey: { type: "string", description: "Base64url-encoded Ed25519 public key" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Agent registered" } },
        },
      },
      "/api/agents/claim": {
        post: {
          summary: "Claim an agent (requires GitHub auth)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Agent claimed" } },
        },
      },
      "/api/agents/me": {
        get: {
          summary: "Get current agent info",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Agent info" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  };

  return NextResponse.json(spec);
}
