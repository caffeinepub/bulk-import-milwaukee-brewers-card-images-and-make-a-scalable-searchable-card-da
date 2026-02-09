# Specification

## Summary
**Goal:** Support bulk importing Milwaukee Brewers card images and metadata, and provide a scalable, server-side searchable/paginated Brewers-focused card catalog.

**Planned changes:**
- Add a required `team` field to card metadata in the backend, support filtering by team, and default existing records to `team = "Milwaukee Brewers"` during upgrade.
- Implement a backend paginated query that supports CardFilters + a free-text search term (case-insensitive) across player/brand/series, returning a next-cursor/hasMore indicator.
- Add an admin-only bulk import workflow: a frontend Import page to upload CSV + images (ZIP or multiple files), show progress and results, and download an error report; plus a backend admin-restricted bulk upsert endpoint that stores images and defaults missing team values to "Milwaukee Brewers".
- Update the catalog UI to use server-side pagination/search via React Query, keep existing filters, and add a team filter defaulted to (and effectively kept on) "Milwaukee Brewers", with pagination controls and loading states.

**User-visible outcome:** An admin can bulk import a Brewers card dataset (CSV + images) and see cards appear in a Brewers-focused catalog that supports fast server-side searching/filtering and paginated browsing without loading the full dataset at once.
