.PHONY: all help install build clean test \
        install-broker install-console install-sdk install-mvp install-all \
        build-broker build-console build-sdk build-all \
        clean-broker clean-console clean-sdk clean-all \
        broker-db-up broker-db-down broker-db-reset broker-db-shell broker-db-logs broker-db-setup \
        broker broker-dev broker-start \
        console console-dev \
        mvp-install mvp-demo mvp-fast mvp-continuous mvp-price-check mvp-stress mvp-multi-realm mvp-all-patterns \
        kill-all kill-broker kill-console kill-agents \
        env-setup env-broker env-console env-mvp \
        dev mvp mvp-start mvp-stop \
        release \
        docker-build docker-build-broker docker-build-console docker-up docker-down docker-logs docker-push docker-push-all

# ==============================================
# Configuration
# ==============================================
BROKER_DIR := broker/service
CONSOLE_DIR := broker/console
SDK_DIR := sdk/node
MVP_DIR := mvp
CORE_DIR := core

# ==============================================
# Environment Variables (Non-Sensitive)
# ==============================================

# Database Configuration
DB_HOST := localhost
DB_PORT := 5433
DB_NAME := broker_db
DB_USER := broker_user
DB_PASSWORD := broker_pass
DATABASE_URL := postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

# Broker Service
ADMIN_API_KEY := admin-key-123
INTERNAL_PORT := 8080
EXTERNAL_PORT := 8443
ADMIN_PORT := 3001
LOG_LEVEL := info

# Console
CONSOLE_PORT := 3000
NEXT_PUBLIC_GATEWAY_URL := http://localhost:$(ADMIN_PORT)
NEXT_PUBLIC_API_KEY := $(ADMIN_API_KEY)

# MVP
GATEWAY_URL := ws://localhost:$(INTERNAL_PORT)
AUTH_TOKEN := demo-token
REALM_ID_PREFIX := demo

# Environment
NODE_ENV := development

# ==============================================
# Help
# ==============================================
all: help

help:
	@echo "< InterRealm Mesh Build System"
	@echo "========================="
	@echo ""
	@echo "=� Installation Commands:"
	@echo "  make install-all        - Install all dependencies (broker, console, sdk, mvp)"
	@echo "  make install-broker     - Install broker dependencies"
	@echo "  make install-console    - Install console dependencies"
	@echo "  make install-sdk        - Install SDK dependencies"
	@echo "  make install-mvp        - Install MVP dependencies (including agents)"
	@echo ""
	@echo "=( Build Commands:"
	@echo "  make build-all          - Build everything (broker, console, sdk)"
	@echo "  make build-broker       - Build broker service"
	@echo "  make build-console      - Build console (Next.js)"
	@echo "  make build-sdk          - Build Node.js SDK"
	@echo ""
	@echo ">� Clean Commands:"
	@echo "  make clean-all          - Clean all build artifacts"
	@echo "  make clean-broker       - Clean broker build"
	@echo "  make clean-console      - Clean console build"
	@echo "  make clean-sdk          - Clean SDK build"
	@echo ""
	@echo "=� Run Commands:"
	@echo "  make broker             - Start broker (with database check)"
	@echo "  make broker-dev         - Start broker in dev mode with hot reload"
	@echo "  make console            - Start console UI"
	@echo "  make console-dev        - Start console in dev mode"
	@echo ""
	@echo "=�  Database Commands:"
	@echo "  make broker-db-up       - Start broker database (PostgreSQL on port 5433)"
	@echo "  make broker-db-down     - Stop broker database"
	@echo "  make broker-db-reset    - Reset broker database (destroys data)"
	@echo "  make broker-db-shell    - Open PostgreSQL shell"
	@echo "  make broker-db-logs     - Show database logs"
	@echo ""
	@echo "<� MVP Demo Commands:"
	@echo "  make mvp-demo           - Run the main MVP demo (price-check)"
	@echo "  make mvp-fast           - Run fast demo scenario"
	@echo "  make mvp-continuous     - Run continuous demo (cycles through patterns)"
	@echo "  make mvp-price-check    - Run price check scenario"
	@echo "  make mvp-stress         - Run stress test scenario"
	@echo "  make mvp-multi-realm    - Run multi-realm coordination"
	@echo "  make mvp-all-patterns   - Run all patterns demo"
	@echo ""
	@echo "=� Kill Commands:"
	@echo "  make kill-all           - Kill all running processes"
	@echo "  make kill-broker        - Kill broker processes"
	@echo "  make kill-console       - Kill console processes"
	@echo "  make kill-agents        - Kill agent processes"
	@echo ""
	@echo ""
	@echo "� QUICK START (One Command):"
	@echo "  make dev                - Setup everything and start dev environment"
	@echo "  make mvp-start          - Start full MVP demo with continuous coordination"
	@echo "  make mvp-stop           - Stop all MVP services"
	@echo ""
	@echo "=� Environment Setup:"
	@echo "  make env-setup          - Generate all .env files from config"
	@echo "  make broker-db-setup    - Apply Prisma schema to database"
	@echo ""
	@echo "=( Docker Commands:"
	@echo "  make docker-build       - Build all Docker images"
	@echo "  make docker-up          - Start all services with Docker Compose"
	@echo "  make docker-down        - Stop all Docker services"
	@echo "  make docker-logs        - Show logs from all services"
	@echo "  make docker-push-all    - Push all images to Docker Hub"
	@echo "  make docker-ps          - Show Docker services status"
	@echo ""
	@echo "=� Release Commands:"
	@echo "  make release TAG=v1.0.0 - Create and push a git tag (triggers CI/CD)"

# ==============================================
# Environment Setup
# ==============================================
env-setup: env-broker env-console env-mvp
	@echo " All .env files generated!"

env-broker:
	@echo "=� Generating broker service .env file..."
	@echo "# Broker Database Configuration (Auto-generated)" > $(BROKER_DIR)/.env
	@echo "DB_HOST=$(DB_HOST)" >> $(BROKER_DIR)/.env
	@echo "DB_PORT=$(DB_PORT)" >> $(BROKER_DIR)/.env
	@echo "DB_NAME=$(DB_NAME)" >> $(BROKER_DIR)/.env
	@echo "DB_USER=$(DB_USER)" >> $(BROKER_DIR)/.env
	@echo "DB_PASSWORD=$(DB_PASSWORD)" >> $(BROKER_DIR)/.env
	@echo "DATABASE_URL=$(DATABASE_URL)" >> $(BROKER_DIR)/.env
	@echo "" >> $(BROKER_DIR)/.env
	@echo "# Admin API Security" >> $(BROKER_DIR)/.env
	@echo "ADMIN_API_KEY=$(ADMIN_API_KEY)" >> $(BROKER_DIR)/.env
	@echo "" >> $(BROKER_DIR)/.env
	@echo "# Internal Broker" >> $(BROKER_DIR)/.env
	@echo "INTERNAL_PORT=$(INTERNAL_PORT)" >> $(BROKER_DIR)/.env
	@echo "" >> $(BROKER_DIR)/.env
	@echo "# External Broker (for partners)" >> $(BROKER_DIR)/.env
	@echo "EXTERNAL_PORT=$(EXTERNAL_PORT)" >> $(BROKER_DIR)/.env
	@echo "" >> $(BROKER_DIR)/.env
	@echo "# Admin Console API" >> $(BROKER_DIR)/.env
	@echo "ADMIN_PORT=$(ADMIN_PORT)" >> $(BROKER_DIR)/.env
	@echo "" >> $(BROKER_DIR)/.env
	@echo "# Logging" >> $(BROKER_DIR)/.env
	@echo "LOG_LEVEL=$(LOG_LEVEL)" >> $(BROKER_DIR)/.env
	@echo "NODE_ENV=$(NODE_ENV)" >> $(BROKER_DIR)/.env
	@echo " Generated $(BROKER_DIR)/.env"

env-console:
	@echo "=� Generating console .env.local file..."
	@echo "# Console Environment Variables (Auto-generated)" > $(CONSOLE_DIR)/.env.local
	@echo "" >> $(CONSOLE_DIR)/.env.local
	@echo "# Gateway API Configuration" >> $(CONSOLE_DIR)/.env.local
	@echo "NEXT_PUBLIC_GATEWAY_URL=$(NEXT_PUBLIC_GATEWAY_URL)" >> $(CONSOLE_DIR)/.env.local
	@echo "NEXT_PUBLIC_API_KEY=$(NEXT_PUBLIC_API_KEY)" >> $(CONSOLE_DIR)/.env.local
	@echo "NEXT_PUBLIC_ADMIN_API_KEY=$(NEXT_PUBLIC_API_KEY)" >> $(CONSOLE_DIR)/.env.local
	@echo "" >> $(CONSOLE_DIR)/.env.local
	@echo "# Environment" >> $(CONSOLE_DIR)/.env.local
	@echo "NODE_ENV=$(NODE_ENV)" >> $(CONSOLE_DIR)/.env.local
	@echo " Generated $(CONSOLE_DIR)/.env.local"

env-mvp:
	@echo "=� Generating MVP .env file..."
	@echo "# Gateway Configuration (Auto-generated)" > $(MVP_DIR)/.env
	@echo "GATEWAY_URL=$(GATEWAY_URL)" >> $(MVP_DIR)/.env
	@echo "AUTH_TOKEN=$(AUTH_TOKEN)" >> $(MVP_DIR)/.env
	@echo "" >> $(MVP_DIR)/.env
	@echo "# Admin API (for seeding and management)" >> $(MVP_DIR)/.env
	@echo "ADMIN_API=http://localhost:$(ADMIN_PORT)" >> $(MVP_DIR)/.env
	@echo "ADMIN_API_KEY=$(ADMIN_API_KEY)" >> $(MVP_DIR)/.env
	@echo "" >> $(MVP_DIR)/.env
	@echo "# Web Console" >> $(MVP_DIR)/.env
	@echo "CONSOLE_PORT=$(CONSOLE_PORT)" >> $(MVP_DIR)/.env
	@echo "" >> $(MVP_DIR)/.env
	@echo "# Agent Configuration" >> $(MVP_DIR)/.env
	@echo "REALM_ID_PREFIX=$(REALM_ID_PREFIX)" >> $(MVP_DIR)/.env
	@echo " Generated $(MVP_DIR)/.env"

broker-db-setup:
	@echo "=� Setting up database schema with Prisma..."
	@if ! docker ps | grep -q broker-postgres 2>/dev/null; then \
		echo "= Database not running, starting it..."; \
		$(MAKE) broker-db-up; \
		sleep 3; \
	fi
	@echo "=� Waiting for database to be ready..."
	@until docker exec broker-postgres pg_isready -U broker_user -d broker_db > /dev/null 2>&1; do \
		echo "� Still waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo " Database is ready!"
	@echo "=� Pushing Prisma schema to database..."
	@cd $(BROKER_DIR) && npx prisma db push --skip-generate
	@echo "=� Generating Prisma client..."
	@cd $(BROKER_DIR) && npx prisma generate
	@echo " Prisma schema applied successfully!"

# ==============================================
# One-Command Workflows
# ==============================================
dev: env-setup install-all broker-db-up broker-db-setup
	@echo ""
	@echo "< Development Environment Ready!"
	@echo "========================="
	@echo ""
	@echo "� Next Steps:"
	@echo "  Terminal 1: make broker-dev    - Start broker service"
	@echo "  Terminal 2: make console-dev   - Start web console"
	@echo ""
	@echo "Or run the MVP demo with: make mvp-start"

# MVP Seed - Create necessary realms for MVP demo
mvp-seed:
	@echo "=� Seeding MVP realms..."
	@cd $(MVP_DIR) && npm run seed

# MVP Start - Start all services in background
mvp-start: env-setup install-mvp broker-db-up broker-db-setup install-console
	@echo ""
	@echo "< Starting MVP Demo Environment..."
	@echo "========================="
	@echo ""
	@mkdir -p logs
	@echo "=� Step 1: Starting broker in background..."
	@cd $(BROKER_DIR) && npm run dev > $(CURDIR)/logs/broker.log 2>&1 &
	@echo "� Waiting for broker to start..."
	@sleep 8
	@echo ""
	@echo "=� Step 1.5: Seeding MVP realms..."
	@$(MAKE) mvp-seed
	@sleep 2
	@echo ""
	@echo "=� Step 2: Starting console UI..."
	@cd $(CONSOLE_DIR) && npm run dev > $(CURDIR)/logs/console.log 2>&1 &
	@sleep 5
	@echo ""
	@echo "=� Step 3: Starting pricing agent..."
	@cd $(MVP_DIR)/agents/pricing-agent && npm start > $(CURDIR)/logs/pricing-agent.log 2>&1 &
	@sleep 2
	@echo ""
	@echo "=� Step 4: Starting inventory agent..."
	@cd $(MVP_DIR)/agents/inventory-agent && npm start > $(CURDIR)/logs/inventory-agent.log 2>&1 &
	@sleep 2
	@echo ""
	@echo "=� Step 5: Starting continuous coordination orchestrator..."
	@cd $(MVP_DIR) && node scenarios/continuous-demo.js > $(CURDIR)/logs/orchestrator.log 2>&1 &
	@sleep 2
	@echo ""
	@echo "< MVP Demo Environment is Running!"
	@echo "======================================"
	@echo ""
	@echo "= Services:"
	@echo "  = Broker:        ws://localhost:8080 (internal)"
	@echo "  =�  Admin API:    http://localhost:3001"
	@echo "  < Web Console:   http://localhost:3000"
	@echo "  =� Database:     localhost:5433"
	@echo ""
	@echo "= Agents Running:"
	@echo "  = PricingAgent (continuously coordinating)"
	@echo "  = InventoryAgent (continuously coordinating)"
	@echo "  =� Orchestrator (cycling through patterns)"
	@echo ""
	@echo "= Continuous Coordination:"
	@echo "  Agents are automatically coordinating over the broker"
	@echo "  Cycling through: Loop, Service Call, and Event patterns"
	@echo "  Watch the coordination in real-time via logs"
	@echo ""
	@echo "= Next Steps:"
	@echo "  1. Open your browser to http://localhost:3000"
	@echo "  2. Use API key: $(ADMIN_API_KEY)"
	@echo "  3. Watch logs to see continuous coordination"
	@echo ""
	@echo "= Logs:"
	@echo "  Broker:       tail -f logs/broker.log"
	@echo "  Console:      tail -f logs/console.log"
	@echo "  Pricing:      tail -f logs/pricing-agent.log"
	@echo "  Inventory:    tail -f logs/inventory-agent.log"
	@echo "  Orchestrator: tail -f logs/orchestrator.log"
	@echo "  All agents:   tail -f logs/*-agent.log logs/orchestrator.log"
	@echo ""
	@echo "= To stop everything: make mvp-stop"
	@echo ""

# MVP Stop - Stop all MVP services
mvp-stop:
	@echo "=� Stopping MVP Demo Environment..."
	@$(MAKE) kill-all
	@echo "=� Stopping database..."
	@$(MAKE) broker-db-down
	@echo ""
	@echo " MVP Demo Environment stopped!"
	@echo ""

# Legacy mvp command (for backward compatibility)
mvp: mvp-start
	@echo ""
	@echo "= Note: 'make mvp' now starts services in background"
	@echo "  Use 'make mvp-stop' to stop all services"

# ==============================================
# Installation
# ==============================================
install-all: install-broker install-console install-sdk install-mvp
	@echo " All dependencies installed!"

install-broker:
	@echo "=� Installing broker dependencies..."
	cd $(BROKER_DIR) && npm install
	@echo " Broker dependencies installed"

install-console:
	@echo "=� Installing console dependencies..."
	cd $(CONSOLE_DIR) && npm install
	@echo " Console dependencies installed"

install-sdk:
	@echo "=� Installing SDK dependencies..."
	cd $(SDK_DIR) && npm install
	@echo " SDK dependencies installed"

install-mvp:
	@echo "=� Installing MVP dependencies..."
	cd $(MVP_DIR) && npm install
	@echo "=� Installing pricing agent dependencies..."
	cd $(MVP_DIR)/agents/pricing-agent && npm install
	@echo "=� Installing inventory agent dependencies..."
	cd $(MVP_DIR)/agents/inventory-agent && npm install
	@echo " MVP dependencies installed"

# ==============================================
# Build
# ==============================================
build-all: build-broker build-console build-sdk
	@echo " All projects built successfully!"

build-broker:
	@echo "=( Building broker..."
	cd $(BROKER_DIR) && npm run build
	@echo " Broker built"

build-console:
	@echo "=( Building console..."
	cd $(CONSOLE_DIR) && npm run build
	@echo " Console built"

build-sdk:
	@echo "=( Building SDK..."
	cd $(SDK_DIR) && npm run build
	@echo " SDK built"

# ==============================================
# Clean
# ==============================================
clean-all: clean-broker clean-console clean-sdk
	@echo " All projects cleaned"

clean-broker:
	@echo ">� Cleaning broker..."
	cd $(BROKER_DIR) && rm -rf dist node_modules/.cache
	@echo " Broker cleaned"

clean-console:
	@echo ">� Cleaning console..."
	cd $(CONSOLE_DIR) && rm -rf .next out node_modules/.cache
	@echo " Console cleaned"

clean-sdk:
	@echo ">� Cleaning SDK..."
	cd $(SDK_DIR) && rm -rf dist node_modules/.cache
	@echo " SDK cleaned"

# ==============================================
# Broker Database
# ==============================================
broker-db-up:
	@echo "=� Starting broker database (PostgreSQL)..."
	@echo "� Checking if ports 5433 and 5051 are available..."
	@if lsof -i :5433 >/dev/null 2>&1; then \
		echo ""; \
		echo "= ERROR: Port 5433 is already in use!"; \
		echo ""; \
		echo "� What's using the port:"; \
		lsof -i :5433 | head -5; \
		echo ""; \
		echo "= To fix this, you can:"; \
		echo "   1. Stop the process: lsof -ti :5433 | xargs kill"; \
		echo "   2. Or change DB_PORT in the Makefile (line 28) to a different port"; \
		echo "   3. Then run: make broker-db-up"; \
		echo ""; \
		exit 1; \
	fi
	@if lsof -i :5051 >/dev/null 2>&1; then \
		echo ""; \
		echo "=  WARNING: Port 5051 (pgAdmin) is already in use!"; \
		echo "� What's using the port:"; \
		lsof -i :5051 | head -5; \
		echo ""; \
		echo "= pgAdmin won't start, but PostgreSQL will. To fix:"; \
		echo "   1. Stop the process: lsof -ti :5051 | xargs kill"; \
		echo "   2. Or edit broker/service/docker-compose.yml to use a different port"; \
		echo ""; \
	fi
	@if docker ps -a | grep -q broker-postgres 2>/dev/null; then \
		if docker ps | grep -q broker-postgres 2>/dev/null; then \
			echo "= Database is already running!"; \
		else \
			echo "= Found stopped container, removing it..."; \
			docker-compose -f $(BROKER_DIR)/docker-compose.yml down; \
			docker-compose -f $(BROKER_DIR)/docker-compose.yml up -d; \
		fi; \
	else \
		docker-compose -f $(BROKER_DIR)/docker-compose.yml up -d; \
	fi
	@echo "=� PostgreSQL is starting on port 5433"
	@echo "=' pgAdmin is available at http://localhost:5051"
	@echo "= Default credentials: admin@broker.local / admin"
	@echo "=� Database: broker_db, User: broker_user"

broker-db-down:
	@echo "=� Stopping broker database..."
	docker-compose -f $(BROKER_DIR)/docker-compose.yml down

broker-db-reset:
	@echo "= Resetting broker database (this will destroy all data)..."
	docker-compose -f $(BROKER_DIR)/docker-compose.yml down -v
	docker-compose -f $(BROKER_DIR)/docker-compose.yml up -d
	@echo "� Waiting for database to be ready..."
	@sleep 5
	@until docker exec broker-postgres pg_isready -U broker_user -d broker_db > /dev/null 2>&1; do \
		sleep 2; \
	done
	@echo " Database reset complete!"
	@echo "=� Applying Prisma schema..."
	@$(MAKE) broker-db-setup

broker-db-shell:
	@echo "=' Opening PostgreSQL shell for broker database..."
	docker exec -it broker-postgres psql -U broker_user -d broker_db

broker-db-logs:
	@echo "=� Showing broker database logs..."
	docker-compose -f $(BROKER_DIR)/docker-compose.yml logs -f broker-postgres

# ==============================================
# Run Broker
# ==============================================
broker: broker-start

broker-start:
	@echo "=� Starting broker with database..."
	@echo "=� Step 1: Checking if database is running..."
	@if ! docker ps | grep -q broker-postgres 2>/dev/null; then \
		echo "= Database not running, starting PostgreSQL..."; \
		docker-compose -f $(BROKER_DIR)/docker-compose.yml up -d; \
		echo "� Waiting for PostgreSQL to be ready..."; \
		sleep 10; \
		until docker exec broker-postgres pg_isready -U broker_user -d broker_db > /dev/null 2>&1; do \
			echo "� Still waiting for PostgreSQL..."; \
			sleep 2; \
		done; \
		echo " PostgreSQL is ready!"; \
	else \
		echo " Database is already running"; \
	fi
	@echo "=� Step 2: Starting broker application..."
	@echo "< Internal Broker: ws://localhost:8080"
	@echo "= External Broker: ws://localhost:8443"
	@echo "=�  Admin API: http://localhost:3001"
	@echo "=� Database: localhost:5433 (broker_db / broker_user)"
	@echo ""
	cd $(BROKER_DIR) && npm start

broker-dev:
	@echo "=� Starting broker in development mode..."
	@if [ ! -f $(BROKER_DIR)/.env ]; then \
		echo "= .env file not found, generating..."; \
		$(MAKE) env-broker; \
	fi
	@if ! docker ps | grep -q broker-postgres 2>/dev/null; then \
		echo "= Starting database..."; \
		docker-compose -f $(BROKER_DIR)/docker-compose.yml up -d; \
		echo "� Waiting for database..."; \
		sleep 5; \
		until docker exec broker-postgres pg_isready -U broker_user -d broker_db > /dev/null 2>&1; do \
			sleep 2; \
		done; \
	fi
	@echo "=% Starting broker with hot reload..."
	cd $(BROKER_DIR) && npm run dev

# ==============================================
# Run Console
# ==============================================
console: console-dev

console-dev:
	@echo "=� Starting console UI..."
	@echo "< Console will be available at: http://localhost:3000"
	cd $(CONSOLE_DIR) && npm run dev

# ==============================================
# MVP Scenarios
# ==============================================
mvp-demo: mvp-price-check

mvp-price-check:
	@echo "<� Running price check scenario..."
	@echo "�  Make sure broker and agents are running!"
	@echo "   Terminal 1: make broker-dev"
	@echo "   Terminal 2: cd mvp/agents/pricing-agent && npm start"
	@echo "   Terminal 3: cd mvp/agents/inventory-agent && npm start"
	@echo ""
	cd $(MVP_DIR) && node scenarios/price-check-scenario.js

mvp-fast:
	@echo "<� Running fast demo scenario..."
	@echo "�  Make sure broker and agents are running!"
	cd $(MVP_DIR) && node scenarios/fast-demo.js

mvp-continuous:
	@echo "<� Running continuous demo (cycles through patterns)..."
	@echo "�  Make sure broker and agents are running!"
	@echo "   This demo will continuously cycle through loop, service, and event patterns"
	cd $(MVP_DIR) && node scenarios/continuous-demo.js

mvp-stress:
	@echo "<� Running stress test scenario..."
	@echo "�  Make sure broker and agents are running!"
	cd $(MVP_DIR) && node scenarios/stress-test.js

mvp-multi-realm:
	@echo "<� Running multi-realm coordination..."
	@echo "�  Make sure broker and agents are running!"
	cd $(MVP_DIR) && node scenarios/multi-realm-coordination.js

mvp-all-patterns:
	@echo "<� Running all patterns demo..."
	@echo "�  Make sure broker and agents are running!"
	cd $(MVP_DIR) && node scenarios/all-patterns.js

# ==============================================
# Kill Processes
# ==============================================
kill-all: kill-broker kill-console kill-agents
	@echo "=� All processes killed"

kill-broker:
	@echo "=� Killing broker processes..."
	@echo "=� Looking for broker processes on ports 3001, 8080, 8443..."
	-@pkill -f "broker.*src/index" 2>/dev/null || true
	-@pkill -f "ts-node.*broker.*index.ts" 2>/dev/null || true
	-@pkill -f "tsx.*broker.*index.ts" 2>/dev/null || true
	-@pkill -f "node.*broker.*index.js" 2>/dev/null || true
	-@for port in 3001 8080 8443; do \
		pid=$$(lsof -ti:$$port 2>/dev/null | head -1); \
		if [ ! -z "$$pid" ]; then \
			echo "=* Killing process $$pid on port $$port"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo " Broker processes killed"

kill-console:
	@echo "=� Killing console processes..."
	@echo "=� Looking for Next.js processes on port 3000..."
	-@pkill -f "next.*dev" 2>/dev/null || true
	-@pkill -f "node.*next.*dev" 2>/dev/null || true
	-@for port in 3000; do \
		pid=$$(lsof -ti:$$port 2>/dev/null | head -1); \
		if [ ! -z "$$pid" ]; then \
			echo "=* Killing process $$pid on port $$port"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo " Console processes killed"

kill-agents:
	@echo "=� Killing agent processes..."
	-@pkill -f "pricing-agent" 2>/dev/null || true
	-@pkill -f "inventory-agent" 2>/dev/null || true
	-@pkill -f "continuous-demo.js" 2>/dev/null || true
	@echo " Agent processes and orchestrator killed"

# ==============================================
# Test
# ==============================================
test:
	@echo ">� Running tests..."
	@echo "�  Test commands to be implemented"
	@echo "   cd $(BROKER_DIR) && npm test"
	@echo "   cd $(SDK_DIR) && npm test"

# ==============================================
# Release Management
# ==============================================
release:
ifndef TAG
	@echo "= ERROR: TAG is required!"
	@echo ""
	@echo "Usage: make release TAG=v1.0.0"
	@echo ""
	@echo "This will:"
	@echo "  1. Build the SDK to verify it compiles"
	@echo "  2. Create a git tag with the specified version"
	@echo "  3. Push the tag to GitHub"
	@echo "  4. Trigger GitHub Actions to:"
	@echo "     - Build and push Docker images (broker, console)"
	@echo "     - Publish SDK to npm"
	@exit 1
endif
	@echo "=� Preparing release $(TAG)..."
	@echo ""
	@echo "=� Step 1: Building SDK to verify..."
	@cd $(SDK_DIR) && npm run build
	@echo " SDK builds successfully!"
	@echo ""
	@echo "=� Step 2: Creating git tag $(TAG)..."
	@git tag $(TAG)
	@echo " Tag created!"
	@echo ""
	@echo "=� Step 3: Pushing tag to GitHub..."
	@git push origin $(TAG)
	@echo ""
	@echo "< Release $(TAG) Published!"
	@echo "======================================"
	@echo ""
	@echo "= GitHub Actions will now:"
	@echo "  1. Build Docker images: realmtrix/broker:$(TAG) & realmtrix/console:$(TAG)"
	@echo "  2. Publish SDK to npm: @realmtrix/sdk@$(TAG)"
	@echo ""
	@echo "= Monitor progress:"
	@echo "  https://github.com/looptix/realm-mesh/actions"
	@echo ""
	@echo "= When complete, your users can:"
	@echo "  - npm install @realmtrix/sdk@$(TAG)"
	@echo "  - docker pull realmtrix/broker:$(TAG)"
	@echo "  - docker pull realmtrix/console:$(TAG)"
	@echo ""

# ==============================================
# Docker Commands
# ==============================================
docker-build: docker-build-broker docker-build-console
	@echo " All Docker images built successfully!"

docker-build-broker:
	@echo "=( Building broker Docker image..."
	docker build -t realmtrix/broker:latest broker/service/
	@echo " Broker image built: realmtrix/broker:latest"

docker-build-console:
	@echo "=( Building console Docker image..."
	docker build -t realmtrix/console:latest broker/console/
	@echo " Console image built: realmtrix/console:latest"

docker-up:
	@echo "=� Starting all services with Docker Compose..."
	docker-compose up -d
	@echo ""
	@echo " Services started!"
	@echo "  Console UI:       http://localhost:3000"
	@echo "  Admin API:        http://localhost:3001"
	@echo "  Internal Gateway: ws://localhost:8080"
	@echo "  External Gateway: ws://localhost:8443"
	@echo "  PostgreSQL:       localhost:5433"

docker-down:
	@echo "=� Stopping all Docker services..."
	docker-compose down
	@echo " Services stopped!"

docker-down-volumes:
	@echo "= Stopping all Docker services and removing volumes..."
	docker-compose down -v
	@echo " Services stopped and data removed!"

docker-logs:
	@echo "=� Showing logs from all services..."
	docker-compose logs -f

docker-logs-broker:
	@echo "=� Showing broker logs..."
	docker-compose logs -f broker

docker-logs-console:
	@echo "=� Showing console logs..."
	docker-compose logs -f console

docker-push-broker:
	@echo "=� Pushing broker image to Docker Hub..."
	docker push realmtrix/broker:latest
	@echo " Broker image pushed!"

docker-push-console:
	@echo "=� Pushing console image to Docker Hub..."
	docker push realmtrix/console:latest
	@echo " Console image pushed!"

docker-push-all: docker-push-broker docker-push-console
	@echo " All images pushed to Docker Hub!"

docker-restart:
	@echo "=� Restarting all Docker services..."
	docker-compose restart
	@echo " Services restarted!"

docker-ps:
	@echo "=� Docker services status:"
	docker-compose ps
