# QA Playwright AI Framework (ES/EN)

Framework de automatización QA escalable con **Playwright + TypeScript** para pruebas web y API, preparado para evolución AI/LLM sin promesas irreales.

## 1) Arquitectura / Architecture

- **Core:** Playwright, TypeScript strict, ESLint, Prettier.
- **Web:** POM con selectores separados de acciones.
- **API:** clientes por dominio/servicio (ReqRes, Fake Store).
- **AI-ready:** capa de autocuración por fallback, análisis de fallos y registro de sugerencias persistente.
- **DevOps:** Azure Pipelines + GitHub Actions, Docker, Docker Compose, Kubernetes Job.

### Estructura del proyecto

```text
.
├── src
│   ├── ai
│   │   ├── failure/failureAnalyzer.ts
│   │   ├── healing/selfHealingLocator.ts
│   │   └── suggestions/suggestionRegistry.ts
│   ├── api/clients
│   │   ├── fakeStore.client.ts
│   │   └── reqres.client.ts
│   ├── config/env.ts
│   ├── utils/logger.ts
│   └── web
│       ├── pages
│       └── selectors
├── tests
│   ├── api
│   ├── fixtures/test.fixture.ts
│   └── web
├── .env.example / .env.local / .env.dev / .env.qa
├── playwright.config.ts
├── azure-pipelines.yml
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── k8s
```

## 2) Flujos implementados hoy / Implemented today

### Web (SauceDemo)
1. Login exitoso y validación de inventario.
2. Agregar item al carrito y checkout completo con confirmación.

### API
1. **ReqRes**: autenticación y validación de token.
2. **Fake Store API**: validación de lista de productos + producto por ID.

## 3) Estrategia de ambientes / Environment strategy

Se soportan `local`, `dev`, `qa` con carga por `TEST_ENV`:

- `.env.local`
- `.env.dev`
- `.env.qa`
- `.env.example`

> Para demo se usan endpoints públicos en los tres ambientes para mostrar aislamiento de configuración. Las credenciales incluidas son públicas (SauceDemo/ReqRes demo).

## 4) AI/self-healing realista (sin “magic claims”)

Implementado:
- **SelfHealingLocator**: selector primario + fallback selectors por estrategia (`css`, `id=`, `text=`, `role=`).
- **FailureAnalyzer**: clasifica fallos (locator/timeout/network/assertion/unknown) y captura metadata + retry.
- **SuggestionRegistry**: persiste señales en `artifacts/ai-suggestions.json`.

Preparado para siguiente fase LLM:
- Punto de extensión claro para enchufar un reparador de locators asistido por LLM usando las señales persistidas.
- No se afirma reparación autónoma total; se entrega base mantenible y extensible.

## 5) Resiliencia, retries y paralelismo

Configurado en `playwright.config.ts`:
- `retries: 1` (**exactamente 1**)
- `fullyParallel: true`
- workers por ambiente (`PARALLEL_WORKERS`)
- artefactos para debugging:
  - `trace: on-first-retry`
  - `screenshot: only-on-failure`
  - `video: retain-on-failure`

## 6) Comandos principales

```bash
npm ci
npx playwright install --with-deps chromium

npm run lint
npm run build

npm run test:web:local
npm run test:web:dev
npm run test:web:qa

npm run test:api:local
npm run test:api:dev
npm run test:api:qa

npm run test:all:qa
```

## 7) CI/CD

### Azure Pipelines
Archivo: `azure-pipelines.yml`
- instala Node + deps + browser
- ejecuta lint + suites web/api
- publica resultados JUnit

### GitHub Actions
Archivo: `.github/workflows/ci.yml`
- flujo equivalente para validación continua

## 8) Docker / Kubernetes

### Docker
```bash
docker build -t qa-playwright-ai-framework .
docker run --rm -e TEST_ENV=qa qa-playwright-ai-framework
```

### Docker Compose
```bash
docker compose up --build
```

### Kubernetes (job local/CI-like)
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/job.yaml
```

Limitación práctica: en K8s se asume imagen ya disponible para el clúster local/runner.

## 9) Calidad local

- ESLint + Prettier
- Husky + lint-staged en pre-commit
- TypeScript strict

## 10) Próximos pasos recomendados

1. Integrar proveedor LLM para sugerir/parchar locators basado en `ai-suggestions.json`.
2. Añadir contract testing de API (JSON schema fuerte por endpoint).
3. Añadir dashboard histórico de fallos/flakiness por suite.
4. Añadir estrategia de secretos real para pipelines (Azure Variable Groups/Key Vault).
