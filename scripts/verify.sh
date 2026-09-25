#!/bin/bash

# PCFC — Script de Verificación Rápida
# Ejecutar antes de commit para verificar que todo esté correcto

set -e

echo "🔍 PCFC — Verificación de Calidad"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# 1. Verificar tipos
echo "1️⃣  Verificando tipos..."
if pnpm check > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Tipos OK${NC}"
else
  echo -e "${RED}❌ Errores de tipos encontrados${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Verificar lint
echo "2️⃣  Verificando lint..."
if pnpm lint > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Lint OK${NC}"
else
  echo -e "${YELLOW}⚠️  Advertencias de lint (ejecutar 'pnpm lint:fix' para corregir)${NC}"
fi
echo ""

# 3. Verificar formato
echo "3️⃣  Verificando formato..."
if pnpm format:check > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Formato OK${NC}"
else
  echo -e "${YELLOW}⚠️  Archivos sin formatear (ejecutar 'pnpm format' para formatear)${NC}"
fi
echo ""

# 4. Verificar build
echo "4️⃣  Verificando build..."
if pnpm build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build OK${NC}"
else
  echo -e "${RED}❌ Error en build${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Verificar archivos críticos
echo "5️⃣  Verificando archivos críticos..."

if [ -f "src/middleware.ts" ]; then
  echo -e "${GREEN}✅ Middleware de seguridad presente${NC}"
else
  echo -e "${RED}❌ Falta src/middleware.ts${NC}"
  ERRORS=$((ERRORS + 1))
fi

if [ -f ".env.example" ]; then
  echo -e "${GREEN}✅ .env.example presente${NC}"
else
  echo -e "${YELLOW}⚠️  Falta .env.example${NC}"
fi

if [ -f "README.md" ]; then
  echo -e "${GREEN}✅ README.md presente${NC}"
else
  echo -e "${YELLOW}⚠️  Falta README.md${NC}"
fi

echo ""

# Resumen
echo "=================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Todo OK — Listo para commit${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS error(s) encontrado(s)${NC}"
  exit 1
fi
