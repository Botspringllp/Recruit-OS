# RecruitOS - Document Inventory & Mapping

This inventory documents all primary product, design, architecture, and database assets associated with the RecruitOS platform, tracking their original locations, standardized folder destinations, descriptions, and verification status.

---

## Document Inventory Table

| Document Name | Current / Original Location | New Standardized Location | Description | Status |
|---|---|---|---|---|
| `recruitos_main_prd.txt` | `PRD.txt` (Root) | `/docs/PRD/recruitos_main_prd.txt` | Primary PRD detailing all 6 Zones, 28 Features, and Business Requirements | **VERIFIED** |
| `recruitos_v2.pdf` | `V2 PRD.pdf` (Root) | `/docs/PRD/recruitos_v2.pdf` | Supporting V2 PRD detailing multi-tenant RLS, magic link, and pipeline rules | **VERIFIED** |
| `recruitos_v3.pdf` | `V3 PRD.pdf` (Root) | `/docs/PRD/recruitos_v3.pdf` | Supporting V3 PRD detailing candidate ownership, split partner fee & retention rules | **VERIFIED** |
| `master_implementation_plan.md` | `master_implementation_plan.md` (Root) | `/architecture/master_implementation_plan.md` | Master implementation roadmap across Phase 1 to Phase 6 | **VERIFIED** |
| `system_design_specification.md` | `system_design_specification.md` (Root) | `/architecture/system_design_specification.md` | System design mapping 30 Stitch UI screens to backend services & database tables | **VERIFIED** |
| `product_blueprint.md` | `system_design_specification.md` (Root) | `/architecture/product_blueprint.md` | Approved Product Blueprint synthesizing UI/UX screen flows and data contracts | **VERIFIED** |
| `database_architecture_specification.md` | `database_architecture_specification.md` (Root) | `/architecture/database_architecture_specification.md` | Final domain-driven database architecture specification covering 10 domains & 43 tables | **VERIFIED** |
| `schema.sql` | `schema.sql` (Root) | `/database/schema.sql` | Production-ready PostgreSQL 16+ / Supabase multi-tenant schema DDL | **VERIFIED** |
| `schema_validation_report.md` | `schema_validation_report.md` (Root) | `/database/schema_validation_report.md` | Complete validation report auditing table counts, RLS, PK/FKs, and soft deletes | **VERIFIED** |
| `index_optimization.md` | `database_index_optimization_specification.md` (Root) | `/database/index_optimization.md` | Database index optimization specification defining 54 performance indexes | **VERIFIED** |

---

## Filename Mapping Notes

1. **`PRD.txt` → `docs/PRD/recruitos_main_prd.txt`**: Standardized file naming while retaining original content intact.
2. **`V2 PRD.pdf` → `docs/PRD/recruitos_v2.pdf`**: Standardized lower-case naming without spaces.
3. **`V3 PRD.pdf` → `docs/PRD/recruitos_v3.pdf`**: Standardized lower-case naming without spaces.
4. **`database_index_optimization_specification.md` → `database/index_optimization.md`**: Mapped to standardized name requested in folder hierarchy.
