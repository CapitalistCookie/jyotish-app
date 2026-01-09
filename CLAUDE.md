# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jyotish is a Vedic astrology application with a React Native mobile frontend and Express backend.

## Tech Stack

- **Mobile**: Expo SDK 52, TypeScript, React Native Paper, Expo Router
- **State Management**: Zustand
- **Backend**: Express, Prisma ORM
- **Database**: PostgreSQL

## Project Structure

```
jyotish-app/
├── apps/
│   └── mobile/          # Expo React Native app
│       ├── app/         # Expo Router screens
│       ├── components/  # Reusable UI components
│       ├── services/    # API calls and external services
│       ├── stores/      # Zustand state stores
│       ├── constants/   # App constants and config
│       └── types/       # TypeScript type definitions
├── packages/
│   └── backend/         # Express API server
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   └── middleware/
│       └── prisma/      # Database schema and migrations
```

## Theme

- Background: `#1a1a2e` (dark purple)
- Accent: `#d4af37` (gold)
- Use React Native Paper's dark theme as base, customized with these colors

## Commands

### Mobile App (apps/mobile)

```bash
# Start development server
npx expo start

# Run on specific platform
npx expo run:ios
npx expo run:android

# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Backend (packages/backend)

```bash
# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Architecture Notes

- Mobile app uses file-based routing via Expo Router in the `app/` directory
- Zustand stores should be modular (one store per domain: user, charts, settings, etc.)
- API services in `services/` should handle all backend communication
- Backend follows controller-service pattern: routes → controllers → services → Prisma
