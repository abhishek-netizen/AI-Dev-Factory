#!/bin/bash

# ============================================================
#  new-project.sh
#  Creates a new project by copying the _template folder
#
#  Usage:
#    ./shared/scripts/new-project.sh <project-name>
#
#  Example:
#    ./shared/scripts/new-project.sh tripmate
# ============================================================

set -e

# ── Colours ────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Args ───────────────────────────────────────────────────
PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}Error: project name is required${NC}"
  echo ""
  echo "Usage:   ./shared/scripts/new-project.sh <project-name>"
  echo "Example: ./shared/scripts/new-project.sh tripmate"
  exit 1
fi

# Lowercase + replace spaces with hyphens
PROJECT_NAME=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# ── Paths ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/projects/_template"
PROJECT_DIR="$ROOT_DIR/projects/$PROJECT_NAME"

# ── Checks ─────────────────────────────────────────────────
if [ ! -d "$TEMPLATE_DIR" ]; then
  echo -e "${RED}Error: template not found at $TEMPLATE_DIR${NC}"
  exit 1
fi

if [ -d "$PROJECT_DIR" ]; then
  echo -e "${YELLOW}Warning: project '$PROJECT_NAME' already exists at $PROJECT_DIR${NC}"
  read -p "Overwrite? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
  rm -rf "$PROJECT_DIR"
fi

# ── Create project ─────────────────────────────────────────
echo ""
echo -e "${BLUE}Creating project: ${GREEN}$PROJECT_NAME${NC}"
echo ""

# Copy template
cp -r "$TEMPLATE_DIR" "$PROJECT_DIR"

# Create backend/frontend/mobile folders
mkdir -p "$PROJECT_DIR/backend/src"
mkdir -p "$PROJECT_DIR/frontend/src"
mkdir -p "$PROJECT_DIR/mobile/app"

echo -e "  ${GREEN}✓${NC} Copied template"
echo -e "  ${GREEN}✓${NC} Created backend/"
echo -e "  ${GREEN}✓${NC} Created frontend/"
echo -e "  ${GREEN}✓${NC} Created mobile/"

# Create tasks folder
mkdir -p "$PROJECT_DIR/tasks"
echo -e "  ${GREEN}✓${NC} Created tasks/"

# Initialise git repo
cd "$PROJECT_DIR"
git init -q
git add .
git commit -q -m "chore: init $PROJECT_NAME from template"
echo -e "  ${GREEN}✓${NC} Initialised git repo"

# ── Done ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✓ Project '$PROJECT_NAME' created!${NC}"
echo ""
echo -e "  ${BLUE}Location:${NC} projects/$PROJECT_NAME"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit  projects/$PROJECT_NAME/PROJECT_SPEC.md"
echo "  2. Edit  projects/$PROJECT_NAME/ARCHITECTURE.md"
echo "  3. Edit  projects/$PROJECT_NAME/CODING_RULES.md"
echo "  4. Add tasks to projects/$PROJECT_NAME/tasks/"
echo "  5. Run   ./shared/scripts/start-project.sh $PROJECT_NAME"
echo ""
