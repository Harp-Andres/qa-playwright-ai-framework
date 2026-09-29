# QA Playwright AI Framework (ES/EN)

**Reusable WEB + API automation framework** with Playwright and TypeScript. Use this repo as the shared foundation (POM, API clients, env config, structured logging, AI-ready helpers). Domain-specific demos (e.g. cruise search) live in separate sample repos.

Framework de automatización QA escalable con **Playwright + TypeScript** para pruebas web y API, preparado para evolución AI/LLM sin promesas irreales.

## 1) Arquitectura / Architecture

- **Core:** Playwright, TypeScript strict, ESLint, Prettier.
- **Web:** POM con selectores separados de acciones.
- **API:** clientes por dominio/servicio con mock local estable para CI.
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
├── scripts/ci-playwright-k8s.sh
├── azure-pipelines.yml
├── .github/workflows
│   ├── ci.yml
│   ├── cd.yml
│   ├── playwright-k8s.yml
│   └── security.yml
├── Dockerfile
├── docker-compose.yml
└── k8s
    ├── configmap.yaml
    └── job.yaml
```

## 2) Flujos implementados hoy / Implemented today

### Web (SauceDemo)

1. Login exitoso y validación de inventario.
2. Agregar item al carrito y checkout completo con confirmación.

### API

1. **Auth demo**: autenticación y validación de token.
2. **Products demo**: validación de lista de productos + producto por ID.

## 3) Estrategia de ambientes / Environment strategy

Se soportan `local`, `dev`, `qa` con carga por `TEST_ENV`:

- `.env.local`
- `.env.dev`
- `.env.qa`
- `.env.example`

> Las pruebas web siguen usando SauceDemo. Las pruebas API apuntan a un mock local iniciado por Playwright para evitar fallos de CI por cambios, rate limits o bloqueos de APIs públicas.

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
- artefactos en cada ejecución (demo):
  - reporters: `list`, `html`, `junit`, `json`, `blob`
  - `trace: on`
  - `screenshot: on`
  - `video: on`
  - salidas: `playwright-report/`, `test-results/`, `blob-report/`, `artifacts/`

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

npm run test:all:local
npm run test:all:dev
npm run test:all:qa

# Unit tests (no browser)
npm run test:unit

# End-to-end (Playwright)
npm run test:e2e
```

## 7) Herramientas por paso

El contrato de la suite es el mismo en local, Docker y Kubernetes: `npm run test:all:qa` (o `test:*` del ambiente) y las cinco evidencias de Playwright más los artefactos de AI.

### Local

| Paso            | Herramienta                                        | Qué hace                                                                                                                                                                 |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Dependencias | npm (`npm ci`)                                     | Instala lo declarado en `package-lock.json`.                                                                                                                             |
| 2. Ambiente     | `cross-env` + `dotenv` + Zod (`src/config/env.ts`) | `TEST_ENV` elige `.env.local`, `.env.dev` o `.env.qa` y valida las variables.                                                                                            |
| 3. Estilo       | ESLint                                             | `npm run lint`.                                                                                                                                                          |
| 4. Tipos        | TypeScript (`tsc --noEmit`)                        | `npm run build`.                                                                                                                                                         |
| 5. Unitarias    | Vitest                                             | `npm run test:unit` sobre `src/**/*.unit.test.ts`. No abre navegador.                                                                                                    |
| 6. Navegador    | Playwright + Chromium                              | En la máquina local: `npx playwright install chromium`. En Docker y Kubernetes los navegadores ya vienen en la imagen base; CI y CD no instalan el browser en el runner. |
| 7. Mock API     | Node (`tests/mocks/mock-api-server.cjs`)           | Playwright lo arranca con `webServer` en `http://127.0.0.1:4010`.                                                                                                        |
| 8. Web y API    | Playwright                                         | `npm run test:all:local` (o `:dev` / `:qa`). SauceDemo en web; el mock en API.                                                                                           |
| 9. Evidencias   | Reporters de Playwright                            | `list`, HTML, JUnit, JSON y blob. `trace`, `screenshot` y `video` en `on`.                                                                                               |
| 10. Señales AI  | `FailureAnalyzer`, `SuggestionRegistry`, teardown  | Escribe `artifacts/ai-suggestions-*.json` y `artifacts/ai-report.json`.                                                                                                  |
| 11. Logs        | Pino                                               | Nivel según `LOG_LEVEL`.                                                                                                                                                 |
| Pre-commit      | Husky + lint-staged + Prettier + ESLint            | Formatea y corrige los archivos del commit.                                                                                                                              |

### Docker

| Paso           | Herramienta                                  | Qué hace                                                                               |
| -------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1. Imagen base | `mcr.microsoft.com/playwright:v1.60.0-noble` | Trae Node y los navegadores de Playwright 1.60.                                        |
| 2. Build       | Docker (`Dockerfile`)                        | `npm ci` y copia el repo. `TEST_ENV=qa` por defecto.                                   |
| 3. Ejecución   | `docker run` o Docker Compose                | Corre `npm run test:all:qa`.                                                           |
| 4. Evidencias  | Volúmenes                                    | Monta `playwright-report/`, `test-results/`, `blob-report/` y `artifacts/` en el host. |

### Kubernetes local

| Paso                 | Herramienta                                    | Qué hace                                                                                                                                              |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Imagen            | Docker                                         | `docker build -t qa-playwright-ai-framework:latest .`                                                                                                 |
| 2. Clúster           | kind                                           | Carga la imagen en el nodo (`kind load`).                                                                                                             |
| 3. Entorno           | `kubectl` + `k8s/configmap.yaml`               | Publica las variables de QA. Las credenciales son las públicas de SauceDemo.                                                                          |
| 4. Suite             | `kubectl` + `k8s/job.yaml`                     | Job indexado: un Pod por shard (`SHARD_TOTAL`, hoy 2). `imagePullPolicy: Never`.                                                                      |
| 5. Mock API          | Playwright `webServer`                         | Sigue en `127.0.0.1:4010` dentro de cada contenedor.                                                                                                  |
| 6. Evidencia del Pod | `scripts/k8s-playwright-shard.sh` + `emptyDir` | Cada Pod guarda su HTML, JUnit, JSON, blob, trazas, screenshots, video y artefactos de AI en `/evidence`.                                             |
| 7. Copia             | `kubectl cp`                                   | Baja cada Pod a `pod-reports/<pod>/`.                                                                                                                 |
| 8. Reporte oficial   | `npx playwright merge-reports`                 | Fusiona los blob de todos los Pods. El HTML resultante incluye trazas, screenshots y video. El mismo comando escribe el JUnit y el JSON consolidados. |

### GitHub Actions — CI

Archivo: `.github/workflows/ci.yml`. Corre en push a `main` y `feature/**`, y en pull requests.

| Paso            | Herramienta                            | Qué hace                                                        |
| --------------- | -------------------------------------- | --------------------------------------------------------------- |
| 1. Checkout     | `actions/checkout@v4`                  | Clona el repo.                                                  |
| 2. Runtime      | `actions/setup-node@v4` (Node 20)      | Prepara Node y la caché de npm.                                 |
| 3. Quality gate | npm + ESLint + `tsc` + Vitest          | `npm ci`, `npm run lint`, `npm run build`, `npm run test:unit`. |
| 4. E2E          | `.github/workflows/playwright-k8s.yml` | Solo si el paso 3 pasa.                                         |

### GitHub Actions — Playwright en Kubernetes

Archivo reutilizable: `.github/workflows/playwright-k8s.yml`. Lo llaman CI y CD. El script es `scripts/ci-playwright-k8s.sh`.

| Paso                 | Herramienta                                                    | Qué hace                                                                                                     |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1. Checkout          | `actions/checkout@v4`                                          | Clona el repo en el runner.                                                                                  |
| 2. Clúster           | kind `v0.33.0` + `kindest/node` 1.37.0                         | Crea el clúster `qa-playwright` si no existe.                                                                |
| 3. Cliente           | kubectl (release estable de Kubernetes)                        | Aplica el ConfigMap y el Job.                                                                                |
| 4. Imagen            | Docker                                                         | Construye `qa-playwright-ai-framework:latest` y la carga en kind.                                            |
| 5. Suite             | Kubernetes Job indexado                                        | Un Pod por shard. Espera hasta 15 minutos. Si falla, deja logs de todos los Pods.                            |
| 6. Evidencia por Pod | `kubectl cp`                                                   | Cada Pod queda en `pod-reports/<pod>/` (HTML, XML, trazas, blob).                                            |
| 7. Reporte oficial   | `playwright merge-reports` + `playwright.merge.config.ts`      | Un HTML con trazas, screenshots y video, más `test-results/results.xml` y `results.json`.                    |
| 8. Artefactos        | `actions/upload-artifact@v4`                                   | Sube el reporte oficial, `pod-reports`, `test-results`, `blob-report` y `artifacts` siempre, 14 días.        |
| 9. GitHub Pages      | `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` | En push a `main`, publica el HTML oficial en la página del repo. Hay que tener Pages en modo GitHub Actions. |

### GitHub Actions — CD

Archivo: `.github/workflows/cd.yml`. Solo en push a `main`.

| Paso           | Herramienta                     | Qué hace                                 |
| -------------- | ------------------------------- | ---------------------------------------- |
| 1. E2E         | El mismo workflow de Kubernetes | La imagen no se publica si el Job falla. |
| 2. Login       | `docker/login-action@v3`        | Entra a `ghcr.io` con `GITHUB_TOKEN`.    |
| 3. Tags        | `docker/metadata-action@v5`     | Tag corto del SHA y `latest`.            |
| 4. Publicación | `docker/build-push-action@v6`   | Construye y empuja `ghcr.io/<repo>`.     |

### GitHub Actions — seguridad

Archivo: `.github/workflows/security.yml`. Push a `main` y `feature/**`, pull requests, y los lunes a las 06:00 UTC.

| Paso                | Herramienta                              | Qué hace                                                                   |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Análisis estático   | CodeQL (`github/codeql-action`)          | Analiza JavaScript. No bloquea el resto si falta GitHub Advanced Security. |
| Dependencias del PR | `actions/dependency-review-action@v4`    | Solo en pull requests.                                                     |
| Secretos            | Gitleaks (`gitleaks/gitleaks-action@v2`) | Historial completo del repo.                                               |
| Audit               | npm audit                                | `npm audit --audit-level=high` después de `npm ci`.                        |

### Azure Pipelines

Archivo: `azure-pipelines.yml`. Agente `ubuntu-latest`. Ramas `main` y `feature/*`.

| Paso                   | Herramienta                    | Qué hace                                                                                                 |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1. Runtime             | `NodeTool@0` (Node 20)         | Instala Node.                                                                                            |
| 2. Quality gate        | npm + ESLint + `tsc` + Vitest  | Igual que el CI de GitHub.                                                                               |
| 3. E2E                 | `scripts/ci-playwright-k8s.sh` | Mismos Pods, copia y `merge-reports` que GitHub.                                                         |
| 4. JUnit               | `PublishTestResults@2`         | Publica el XML consolidado `test-results/**/*.xml`.                                                      |
| 5. Resto de evidencias | `PublishPipelineArtifact@1`    | HTML oficial, reportes por Pod, `test-results`, blob y artefactos de AI. Siempre, aunque la suite falle. |

## 8) Docker / Kubernetes

### Docker

```bash
docker build -t qa-playwright-ai-framework .
docker run --rm -e TEST_ENV=qa \
  -v ${PWD}/playwright-report:/app/playwright-report \
  -v ${PWD}/test-results:/app/test-results \
  -v ${PWD}/blob-report:/app/blob-report \
  -v ${PWD}/artifacts:/app/artifacts \
  qa-playwright-ai-framework
```

### Docker Compose

Monta `playwright-report`, `test-results`, `blob-report` y `artifacts` en el host.

```bash
docker compose up --build
```

### Kubernetes

La imagen local es `qa-playwright-ai-framework:latest` (`imagePullPolicy: Never`). El ConfigMap aporta el entorno de QA, incluido `SHARD_TOTAL`. El Job crea un Pod por shard. El mock API lo arranca Playwright dentro de cada contenedor.

En CI/CD, `scripts/ci-playwright-k8s.sh` hace el build, el Job, la copia y el merge. En un clúster que ya tiene la imagen:

```bash
docker build -t qa-playwright-ai-framework:latest .
kind load docker-image qa-playwright-ai-framework:latest --name qa-playwright
kubectl apply -f k8s/configmap.yaml
kubectl delete job qa-playwright-tests --ignore-not-found
kubectl apply -f k8s/job.yaml
```

Cada Pod deja su evidencia en `/evidence`. Para armar el reporte oficial con las herramientas de Playwright:

```bash
mkdir -p pod-reports blob-report
for pod in $(kubectl get pods -l job-name=qa-playwright-tests -o jsonpath='{range .items[*]}{.metadata.name}{" "}{end}'); do
  mkdir -p "pod-reports/${pod}/blob-report"
  kubectl cp "${pod}:/evidence/playwright-report" "pod-reports/${pod}/playwright-report"
  kubectl cp "${pod}:/evidence/test-results" "pod-reports/${pod}/test-results"
  kubectl cp "${pod}:/evidence/blob-report" "pod-reports/${pod}/blob-report"
  kubectl cp "${pod}:/evidence/artifacts" "pod-reports/${pod}/artifacts"
  cp "pod-reports/${pod}/blob-report/"*.zip "blob-report/${pod}.zip" || true
done

npx playwright merge-reports -c playwright.merge.config.ts blob-report
```

`playwright-report/index.html` es el reporte oficial. `pod-reports/` conserva el HTML, el XML y las trazas de cada Pod. En push a `main`, CI y CD publican ese HTML en GitHub Pages.

## 9) Calidad local

El detalle de ESLint, Prettier, Husky, lint-staged y `tsc` está en el paso local de la sección 7. TypeScript corre en modo strict.

## 10) Próximos pasos recomendados

1. Integrar proveedor LLM para sugerir/parchar locators basado en `ai-suggestions.json`.
2. Añadir contract testing de API (JSON schema fuerte por endpoint).
3. Añadir dashboard histórico de fallos/flakiness por suite.
4. Añadir estrategia de secretos real para pipelines (Azure Variable Groups/Key Vault).
