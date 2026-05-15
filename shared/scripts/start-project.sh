#!/bin/bash

# ============================================================
#  start-project.sh
#  Starts all containers for a given project
#
#  Usage:
#    ./shared/scripts/start-project.sh <project-name> [mode]
#
#  Modes:
#    full    → api + web + mobile + all infra (default)
#    api     → api only
#    web     → web only
#    mobile  → mobile only
#    infra   → ollama + redis + agent + telegram only
#
#  Examples:
#    ./shared/scripts/start-project.sh myapp
#    ./shared/scripts/start-project.sh myapp api
#    ./shared/scripts/start-project.sh myapp infra
# ============================================================

set -e

# ── Colours ────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Args ───────────────────────────────────────────────────
PROJECT_NAME=$1
MODE=${2:-full}

if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}Error: project name is required${NC}"
  echo ""
  echo "Usage:   ./shared/scripts/start-project.sh <project-name> [mode]"
  echo "Modes:   full | api | web | mobile | infra"
  echo "Example: ./shared/scripts/start-project.sh myapp"
  exit 1
fi

# ── Paths ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_DIR="$ROOT_DIR/projects/$PROJECT_NAME"
ENV_FILE="$ROOT_DIR/.env"

# ── Checks ─────────────────────────────────────────────────
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}Error: project '$PROJECT_NAME' not found at $PROJECT_DIR${NC}"
  echo ""
  echo "Create it first:"
  echo "  ./shared/scripts/new-project.sh $PROJECT_NAME"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: .env file not found at $ROOT_DIR/.env${NC}"
  echo "Copy .env.example and fill in your values."
  exit 1
fi

# ── Header ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AI Dev Factory — Starting Project${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Project : ${GREEN}$PROJECT_NAME${NC}"
echo -e "  Mode    : ${GREEN}$MODE${NC}"
echo -e "  Root    : $ROOT_DIR"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$ROOT_DIR"

# ── Define service groups ──────────────────────────────────
INFRA_SERVICES="ollama redis agent-controller llm-router telegram-bot"
PROJECT_SERVICES="api web mobile"
TEST_SERVICES="playwright"

# ── Start based on mode ────────────────────────────────────
case $MODE in

  full)
    echo -e "${CYAN}Starting all services...${NC}"
    docker compose --env-file "$ENV_FILE" up -d \
      $INFRA_SERVICES $PROJECT_SERVICES $TEST_SERVICES
    ;;

  api)
    echo -e "${CYAN}Starting API only...${NC}"
    docker compose --env-file "$ENV_FILE" up -d \
      redis api
    ;;

  web)
    echo -e "${CYAN}Starting web only...${NC}"
    docker compose --env-file "$ENV_FILE" up -d \
      redis api web
    ;;

  mobile)
    echo -e "${CYAN}Starting mobile only...${NC}"
    docker compose --env-file "$ENV_FILE" up -d \
      redis api mobile
    ;;

  infra)
    echo -e "${CYAN}Starting infra only (AI + agent + telegram)...${NC}"
    docker compose --env-file "$ENV_FILE" up -d \
      $INFRA_SERVICES redis
    ;;

  *)
    echo -e "${RED}Error: unknown mode '$MODE'${NC}"
    echo "Valid modes: full | api | web | mobile | infra"
    exit 1
    ;;

esac

# ── Wait and show status ───────────────────────────────────
echo ""
echo -e "${CYAN}Waiting for containers to be ready...${NC}"
sleep 3

echo ""
echo -e "${BLUE}Container Status:${NC}"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# ── Open simulators if mobile mode ────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "mobile" ]; then
  echo ""
  echo -e "${YELLOW}Opening local simulators...${NC}"

  # iOS Simulator
  if command -v xcrun &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Opening iOS Simulator"
    open -a Simulator &
  else
    echo -e "  ${YELLOW}⚠${NC}  iOS Simulator not found (Xcode not installed)"
  fi

  # Android Emulator
  if [ -n "$ANDROID_HOME" ]; then
    EMULATOR="$ANDROID_HOME/emulator/emulator"
    AVD=$(${EMULATOR} -list-avds 2>/dev/null | head -1)
    if [ -n "$AVD" ]; then
      echo -e "  ${GREEN}✓${NC} Opening Android Emulator: $AVD"
      "$EMULATOR" -avd "$AVD" -no-snapshot-load &> /dev/null &
    else
      echo -e "  ${YELLOW}⚠${NC}  No Android AVD found — create one in Android Studio"
    fi
  else
    echo -e "  ${YELLOW}⚠${NC}  ANDROID_HOME not set — skipping Android emulator"
  fi
fi

# ── Done ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✓ Project '$PROJECT_NAME' is running!${NC}"
echo ""
echo -e "${BLUE}Access points:${NC}"
echo -e "  API      → ${CYAN}http://localhost:4000${NC}"
echo -e "  Web      → ${CYAN}http://localhost:5173${NC}"
echo -e "  Metro    → ${CYAN}http://localhost:8081${NC}"
echo -e "  Ollama   → ${CYAN}http://localhost:11434${NC}"
echo -e "  Agent    → ${CYAN}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  Logs    : docker compose logs -f api"
echo -e "  Stop    : docker compose down"
echo -e "  Restart : docker compose restart api"
echo ""
