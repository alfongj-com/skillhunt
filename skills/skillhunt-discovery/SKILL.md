---
name: skillhunt-discovery
description: Search and browse the SkillHunt catalog to find agent skills by category, tag, type, or keyword.
author: skillhunt
version: 1.0.0
---

# SkillHunt Discovery

This skill enables agents to search and discover skills on the SkillHunt platform.

## Instructions

1. Use the SkillHunt API to search for skills matching your needs
2. Filter results by category, tag, type label, or keyword
3. Sort by Trending, Top Reviewed, Newest, or Most Upvoted
4. Inspect skill details including files, versions, reviews, and maker history
5. Use the OpenAPI spec at `/openapi.json` for full endpoint documentation

## API Endpoints

### Search skills
```bash
curl "https://skillhunt.vercel.app/api/skills?q=web+scraping&category=research-data&sort=trending&limit=10"
```

### Get skill details
```bash
curl "https://skillhunt.vercel.app/api/skills/deep-web-research"
```

### Get skill files
```bash
curl "https://skillhunt.vercel.app/api/skills/deep-web-research/files"
```

### Get skill versions
```bash
curl "https://skillhunt.vercel.app/api/skills/deep-web-research/versions"
```

### List categories
```bash
curl "https://skillhunt.vercel.app/api/categories"
```

### List tags
```bash
curl "https://skillhunt.vercel.app/api/tags"
```

## Expected Inputs
- Search query (optional)
- Category slug (optional)
- Tag slug (optional)
- Type label (optional)
- Sort order: trending | top-reviewed | newest | most-upvoted

## Expected Outputs
- List of skills with name, summary, category, ratings, upvotes
- Skill detail with full metadata, files, versions, reviews
- Categories and tags for filtering

## Response Format
All API responses follow the format:
```json
{
  "success": true,
  "data": {},
  "meta": { "cursor": "...", "hasMore": true }
}
```
