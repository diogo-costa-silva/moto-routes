# Moto Routes

> Motorcycle route discovery platform for Portugal and beyond.

[![Status](https://img.shields.io/badge/Status-Phase%200%20Complete-green)]()
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Supabase%20%2B%20Mapbox-blue)]()

---

## About

Moto Routes is a curated collection of verified motorcycle routes. Every route comes from real GPS data - no synthetic paths, no algorithm-generated roads.

**Philosophy**: Quality over quantity. 20 perfect routes are worth more than 100 mediocre ones.

---

## Features (MVP)

- Interactive map with smooth animations
- Route visualization with drawing animations
- Points of interest along routes
- Multi-stage journey planning
- Geographic destination discovery
- User favorites and history
- Bilingual interface (PT/EN)
- Landscape type filtering
- GPX download for offline navigation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Maps | Mapbox GL JS 3.x |
| Backend | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Deploy | Vercel + Supabase Cloud |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/moto-routes-v4.git
cd moto-routes-v4

# Install frontend dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Mapbox credentials

# Start development server
npm run dev
```

See [Setup Guide](./docs/SETUP.md) for detailed instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Documentation Index](./docs/INDEX.md) | Complete documentation map |
| [Vision](./docs/VISION.md) | Project goals and philosophy |
| [Roadmap](./docs/ROADMAP.md) | Implementation phases |
| [Architecture](./docs/ARCHITECTURE.md) | System design |
| [Progress](./PROGRESS.md) | Current status |

---

## Project Status

**Current Phase**: 0 - Preparation (Complete)

**Next Phase**: 1 - Foundation (Supabase + Vite setup)

See [Progress](./PROGRESS.md) for detailed status.

---

## Available Routes

| Route | Country | Distance |
|-------|---------|----------|
| N2 (Chaves → Faro) | Portugal | 739 km |
| N222 (Vale do Douro) | Portugal | 27 km |
| N304 (Serra do Alvão) | Portugal | 36 km |
| Figueres → Cadaqués | Spain | ~60 km |

Plus 3 additional N222 variants.

---

## Contributing

See [Contributing Guide](./CONTRIBUTING.md) for how to contribute to this project.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Author

Diogo Silva - Built with passion for motorcycling and clean code.
