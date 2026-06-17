# AstroVerse - Deployment & Operations Guide

This guide details deployment options for AstroVerse on local systems using Docker or on cloud instances (specifically Azure Container Apps and PostgreSQL databases).

---

## 1. Local Containerized Deployment

AstroVerse is fully dockerized with compose configurations for rapid evaluation.

### 1.1. Running the Complete Stack
Run from the project root:
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
This boots:
1. **PostgreSQL** database listening on port `5432` with preloaded seed tables.
2. **Redis** cache server on port `6379`.
3. **AstroVerse API** server on port `5000` (exposing Swagger interface).
4. **Next.js client** app on port `3000`.

---

## 2. Cloud Production Deployment: Azure Topology

For commercial launches, we recommend deploying to Azure utilizing containerized architectures:

```text
               ┌──────────────────────┐
               │    Azure DNS / CDN   │
               └──────────┬───────────┘
                          ▼
               ┌──────────────────────┐
               │ Azure Container Apps │
               │   (Next.js Front)    │
               └──────────┬───────────┘
                          ▼
               ┌──────────────────────┐
               │ Azure Container Apps │
               │   (.NET 9 Web API)   │
               └────┬────────────┬────┘
                    │            │
                    ▼            ▼
 ┌─────────────────────┐      ┌─────────────────────┐
 │ Azure Db PostgreSQL │      │ Azure Cache - Redis │
 └─────────────────────┘      └─────────────────────┘
```

### 2.1. Environment Variables Configuration

Ensure the following variables are loaded into your container environments:

```ini
# Backend API
ConnectionStrings__DefaultConnection="Server=tcp:astro-pg.postgres.database.azure.com;Database=astroverse;User Id=dbadmin;Password=YourPassword;"
Redis__ConnectionString="astro-redis.redis.cache.windows.net:6380,password=YourRedisPassword,ssl=True,abortConnect=False"
Jwt__Secret="YourSuperSecretJWTKeyThatIs32CharactersOrMore"
Jwt__Issuer="AstroVerse"
Jwt__Audience="AstroVerseUsers"
Ai__OpenAiApiKey="YourOpenAiServiceKey"

# Frontend Web Client
NEXT_PUBLIC_API_URL="https://api.astroverse.com"
```

---

## 3. Kubernetes (AKS) Readiness

For scale-out deployments, manifest examples are stored inside the `docker/k8s/` folder containing deployment, service, and ingress definitions.
To deploy to AKS cluster:
```bash
kubectl apply -f docker/k8s/
```
This mounts pods with horizontal pod autoscaling rules triggered at 80% CPU usage.
