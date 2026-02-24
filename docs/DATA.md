# Available Data

> GPX files and test data for Moto Routes.

---

## GPX Files

All route data comes from real GPS recordings. No synthetic or algorithm-generated paths.

### File Inventory

| File | Country | Distance | Description |
|------|---------|----------|-------------|
| `pt-n2.gpx` | PT | 739 km | Chaves to Faro, longest road in Portugal |
| `pt-n222.gpx` | PT | 27 km | Douro Valley, rated among world's best |
| `pt-n222-ext-mesao-frio.gpx` | PT | ~5 km | Extension: panoramic detour |
| `pt-n222-ext-pias.gpx` | PT | ~3 km | Extension: viewpoint |
| `pt-n222-var-margem-norte.gpx` | PT | ~10 km | Variant: alternative ending |
| `pt-n304-alvao.gpx` | PT | 36 km | Serra do Alvao, one of Europe's best |
| `es-figueres-cadaques.gpx` | ES | ~60 km | Costa Brava coastal route |

**Total: 7 routes** ready for import

### Naming Convention

```
{country}-{code}[-{type}-{name}].gpx
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `country` | ISO 2-letter code | `pt`, `es`, `fr` |
| `code` | Road code (lowercase) | `n222`, `n304`, `n2` |
| `type` | Relationship type | `ext` (extension), `var` (variant), `seg` (segment) |
| `name` | Descriptive name | `mesao-frio`, `margem-norte` |

**Rules:**
- Always lowercase
- No accents or special characters
- Hyphens to separate words
- Country prefix is mandatory
- Type is mandatory if related to parent route

### Directory Structure

```
data/
├── pt/                              # Portugal
│   ├── pt-n2.gpx
│   ├── pt-n222.gpx
│   ├── pt-n222-ext-mesao-frio.gpx
│   ├── pt-n222-ext-pias.gpx
│   ├── pt-n222-var-margem-norte.gpx
│   └── pt-n304-alvao.gpx
└── es/                              # Spain
    └── es-figueres-cadaques.gpx
```

---

## Route Relationships

The N222 variants demonstrate the data model's relationship types:

| Route | Relationship | Parent |
|-------|--------------|--------|
| `pt-n222.gpx` | Base route | - |
| `pt-n222-ext-mesao-frio.gpx` | `is_extension_of` | pt-n222 |
| `pt-n222-ext-pias.gpx` | `is_extension_of` | pt-n222 |
| `pt-n222-var-margem-norte.gpx` | `is_variant_of` | pt-n222 |

---

## Test Data to Create

### Routes Configuration

| Code | Name | Country | Landscape Type | GPX File |
|------|------|---------|----------------|----------|
| pt-n222 | Estrada do Douro | PT | river_valley | `pt-n222.gpx` |
| pt-n222-ext-mesao-frio | Extensao Mesao Frio | PT | river_valley | `pt-n222-ext-mesao-frio.gpx` |
| pt-n222-ext-pias | Extensao Pias | PT | river_valley | `pt-n222-ext-pias.gpx` |
| pt-n222-var-margem-norte | Variante Margem Norte | PT | river_valley | `pt-n222-var-margem-norte.gpx` |
| pt-n304-alvao | N304 Alvao | PT | mountain | `pt-n304-alvao.gpx` |
| pt-n2 | Chaves-Faro | PT | mixed | `pt-n2.gpx` |
| es-figueres-cadaques | Figueres-Cadaques | ES | coast | `es-figueres-cadaques.gpx` |

### Journeys

| Name | Stages | Type |
|------|--------|------|
| Rota do Douro | N222 + extensions | Linear |
| Volta Tras-os-Montes | N304-A + N2 (partial) | Circular |

### Destinations

| Name | Area Coverage |
|------|---------------|
| Vale do Douro | Regua to Pinhao region |
| Serra do Alvao | Vila Real area |
| Tras-os-Montes | Northern interior |

### POIs

| Name | Type | Route | Association | Distance |
|------|------|-------|-------------|----------|
| Miradouro S. Leonardo | viewpoint | N222 | on_route | 0m |
| Quinta do Bomfim | historical_site | N222 | near_route | 200m |
| Restaurante DOC | restaurant | N222 | detour | 800m |
| Miradouro Fisgas de Ermelo | viewpoint | N304-A | detour | 2km |
| Posto BP Vila Real | fuel_station | N304-A | on_route | 0m |

---

## GPX File Format

All GPX files must follow the GPX 1.1 specification:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Moto Routes">
  <metadata>
    <name>Route Name</name>
    <desc>Route description</desc>
  </metadata>
  <trk>
    <name>Track Name</name>
    <trkseg>
      <trkpt lat="41.1234" lon="-8.5678">
        <ele>150</ele>
      </trkpt>
      <!-- more points -->
    </trkseg>
  </trk>
</gpx>
```

**Important**: GPX uses `lat`, `lon` attribute order, but internally we store as `(longitude, latitude)`.

---

## Adding New Routes

1. Record GPS track using any GPS device or app
2. Export as GPX 1.1 format
3. Name the file following the convention: `{country}-{code}[-{type}-{name}].gpx`
4. Place file in appropriate `data/{country}/` directory
5. Run import script (Phase 2):

```bash
cd scripts
python import_gpx.py ../data/pt/pt-new-route.gpx \
  --code "pt-new-route" \
  --name "Route Name"
```

**Examples:**
- Base route: `pt-n125.gpx`
- Extension: `pt-n125-ext-faro-beach.gpx`
- Variant: `pt-n125-var-inland.gpx`

See [Commands](./COMMANDS.md) for full import options (available in Phase 2).

---

## Data Quality Requirements

- **Minimum points**: 50 trackpoints per route
- **Maximum point gap**: 500 meters between consecutive points
- **Elevation data**: Preferred but optional
- **Encoding**: UTF-8 (required for Portuguese characters)

---

## Related Documents

- [Schema](./SCHEMA.md) - How route data is stored
- [Setup](./SETUP.md) - Import pipeline setup
- [Commands](./COMMANDS.md) - Import commands
