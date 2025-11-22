.PHONY: help up down restart logs build clean ps shell-backend shell-frontend shell-mysql

help: ## Hiển thị help
	@echo "G-Bridge Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start tất cả services
	docker-compose up -d

up-build: ## Build và start tất cả services
	docker-compose up -d --build

down: ## Stop tất cả services
	docker-compose down

down-volumes: ## Stop và xóa volumes (bao gồm database)
	docker-compose down -v

restart: ## Restart tất cả services
	docker-compose restart

restart-backend: ## Restart backend
	docker-compose restart backend

restart-frontend: ## Restart frontend
	docker-compose restart frontend

restart-mysql: ## Restart mysql
	docker-compose restart mysql

logs: ## Xem logs tất cả services
	docker-compose logs -f

logs-backend: ## Xem logs backend
	docker-compose logs -f backend

logs-frontend: ## Xem logs frontend
	docker-compose logs -f frontend

logs-mysql: ## Xem logs mysql
	docker-compose logs -f mysql

build: ## Build tất cả images
	docker-compose build

build-backend: ## Build backend image
	docker-compose build backend

build-frontend: ## Build frontend image
	docker-compose build frontend

clean: ## Xóa containers, networks, volumes và images
	docker-compose down -v --rmi all

ps: ## Hiển thị status các services
	docker-compose ps

shell-backend: ## Mở shell trong backend container
	docker-compose exec backend sh

shell-frontend: ## Mở shell trong frontend container
	docker-compose exec frontend sh

shell-mysql: ## Mở MySQL shell
	docker-compose exec mysql mysql -u gbridge_user -pgbridge_password gbridge_db

install-backend: ## Cài package trong backend
	docker-compose exec backend npm install

install-frontend: ## Cài package trong frontend
	docker-compose exec frontend npm install

backup-db: ## Backup database
	docker-compose exec mysql mysqldump -u gbridge_user -pgbridge_password gbridge_db > backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Backup created: backup-*.sql"

restore-db: ## Restore database (usage: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore-db FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose exec -T mysql mysql -u gbridge_user -pgbridge_password gbridge_db < $(FILE)

