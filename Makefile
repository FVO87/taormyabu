# Makefile para facilitar comandos do WhatsApp Bot

build:
	docker-compose build

up:
	docker-compose up

start:
	docker-compose up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose down && docker-compose up -d

shell:
	docker exec -it whatsapp-bot sh

clean:
	docker-compose down -v --remove-orphans
