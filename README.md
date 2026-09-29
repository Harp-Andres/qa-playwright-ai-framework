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
    ├── kustomization.yaml   # namespace, Secret generado, SHARD_TOTAL = completions
    ├── namespace.yaml       # Pod Security "restricted"
    ├── serviceaccount.yaml
    ├── configmap.yaml
    ├── credentials.env      # credenciales públicas de la demo → Secret
    ├── pvc.yaml             # volumen de evidencia compartido por los shards
    ├── job.yaml
    └── collector/           # pod que lee el PVC cuando termina el Job
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

| Paso           | Herramienta                                  | Qué hace                                                                                |
| -------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1. Imagen base | `mcr.microsoft.com/playwright:v1.60.0-noble` | Trae Node y los navegadores de Playwright 1.60.                                         |
| 2. Build       | Docker (`Dockerfile`)                        | `npm ci` y copia el repo como `pwuser` (uid 1001), sin root. `TEST_ENV=qa` por defecto. |
| 3. Ejecución   | `docker run` o Docker Compose                | Corre `npm run test:all:qa`. Compose sube `/dev/shm` a 1 GB para Chromium.              |
| 4. Evidencias  | Volúmenes                                    | Monta `playwright-report/`, `test-results/`, `blob-report/` y `artifacts/` en el host.  |

### Kubernetes local

| Paso                 | Herramienta                             | Qué hace                                                                                                                                                                               |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Imagen            | Docker                                  | `docker build -t qa-playwright-ai-framework:latest .`                                                                                                                                  |
| 2. Clúster           | kind                                    | Carga la imagen en el nodo (`kind load`).                                                                                                                                              |
| 3. Manifiestos       | Kustomize (`kubectl apply -k k8s`)      | Namespace `qa-playwright` con Pod Security `restricted`, ServiceAccount sin token, ConfigMap, Secret generado desde `credentials.env`, PVC y Job. `SHARD_TOTAL` sale de `completions`. |
| 4. Suite             | Job indexado (`k8s/job.yaml`)           | Un Pod por shard. `backoffLimitPerIndex: 0`: un shard que falla no detiene a los demás. `activeDeadlineSeconds` y `ttlSecondsAfterFinished` acotan y limpian el Job.                   |
| 5. Seguridad del Pod | `securityContext`                       | uid 1001, `runAsNonRoot`, sin escalada de privilegios, sin capabilities, seccomp `RuntimeDefault`.                                                                                     |
| 6. Mock API          | Playwright `webServer`                  | Sigue en `127.0.0.1:4010` dentro de cada contenedor.                                                                                                                                   |
| 7. Evidencia         | `scripts/k8s-playwright-shard.sh` + PVC | Cada shard copia su HTML, JUnit, JSON, blob, trazas, screenshots, video y artefactos de AI a `/evidence/shard-<n>/`, guarda su `exit-code` y termina con el resultado real.            |
| 8. Recolección       | Pod `k8s/collector` + `kubectl cp`      | Cuando el Job termina, un pod de solo lectura monta el PVC y se copia a `pod-reports/shard-<n>/`.                                                                                      |
| 9. Reporte oficial   | `npx playwright merge-reports`          | Fusiona los blob de todos los shards. El HTML resultante incluye trazas, screenshots y video. El mismo comando escribe el JUnit y el JSON consolidados.                                |

### GitHub Actions — CI

Archivo: `.github/workflows/ci.yml`. Corre en pull requests y en push a `main` (el merge). Una rama sin PR no dispara CI. `concurrency` cancela la corrida anterior del mismo PR cuando llega un commit nuevo.

| Paso            | Herramienta                                                    | Qué hace                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Quality gate | npm + ESLint + `tsc` + Vitest (Node 20)                        | `npm ci`, `npm run lint`, `npm run build`, `npm run test:unit`.                                                                                                                     |
| 2. Manifiestos  | `kubectl kustomize` + kubeconform `v0.8.0`                     | Renderiza `k8s/` y `k8s/collector/` y los valida contra los esquemas de Kubernetes en modo estricto. En paralelo con el paso 1.                                                     |
| 3. E2E          | `.github/workflows/playwright-k8s.yml`                         | Solo si los pasos 1 y 2 pasan. En push a `main`, publica en GHCR la imagen probada con tag `sha-<commit>`.                                                                          |
| 4. GitHub Pages | `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` | Solo en push a `main`. Publica el HTML oficial en `https://harp-andres.github.io/qa-playwright-ai-framework/`, también cuando la suite falla. Un fallo de Pages no pone CI en rojo. |

### GitHub Actions — Playwright en Kubernetes

Archivo reutilizable: `.github/workflows/playwright-k8s.yml`. Lo llama CI. El script es `scripts/ci-playwright-k8s.sh`.

| Paso               | Herramienta                                               | Qué hace                                                                                                                        |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1. Imagen          | Docker                                                    | Construye una sola vez `ghcr.io/<repo>:sha-<commit>`. Esa misma imagen se prueba y se publica.                                  |
| 2. Clúster         | kind `v0.33.0` + `kindest/node` 1.37.0                    | Crea el clúster `qa-playwright` y carga la imagen.                                                                              |
| 3. Manifiestos     | Kustomize                                                 | Aplica `k8s/` con la imagen del commit, sobre un PVC vacío.                                                                     |
| 4. Suite           | Job indexado                                              | Un Pod por shard. Espera la condición `Complete` o `Failed` (máximo 25 minutos). Si falla, anota los logs de los Pods fallidos. |
| 5. Recolección     | Pod `k8s/collector` + `kubectl cp`                        | Copia el PVC a `pod-reports/shard-<n>/`. El job falla si falta el blob o el `exit-code` de algún shard.                         |
| 6. Reporte oficial | `playwright merge-reports` + `playwright.merge.config.ts` | Un HTML con trazas, screenshots y video, más `test-results/results.xml` y `results.json`. Exige un blob por shard.              |
| 7. Artefactos      | `actions/upload-artifact@v4`                              | Sube el reporte oficial, `pod-reports`, `test-results`, `blob-report` y `artifacts` siempre, 14 días.                           |
| 8. Publicación     | `docker/login-action@v3` + `docker push`                  | Solo si CI lo pide (push a `main`) y todo pasó.                                                                                 |

### GitHub Actions — CD

Archivo: `.github/workflows/cd.yml`. Se dispara con `workflow_run` cuando CI termina en verde en un push a `main`. No construye ni vuelve a correr las pruebas.

| Paso         | Herramienta                       | Qué hace                                                                              |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------- |
| 1. Login     | `docker/login-action@v3`          | Entra a `ghcr.io` con `GITHUB_TOKEN`.                                                 |
| 2. Promoción | `docker buildx imagetools create` | Etiqueta como `latest` y `sha-<corto>` el mismo digest que CI probó (`sha-<commit>`). |

### GitHub Actions — seguridad

Archivo: `.github/workflows/security.yml`. Pull requests, push a `main` y los lunes a las 06:00 UTC, con la misma `concurrency` que CI.

| Paso                | Herramienta                              | Qué hace                                                                   |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Análisis estático   | CodeQL (`github/codeql-action`)          | Analiza JavaScript. No bloquea el resto si falta GitHub Advanced Security. |
| Dependencias del PR | `actions/dependency-review-action@v4`    | Solo en pull requests.                                                     |
| Secretos            | Gitleaks (`gitleaks/gitleaks-action@v2`) | Historial completo del repo.                                               |
| Audit               | npm audit                                | `npm audit --audit-level=high` después de `npm ci`.                        |

### Azure Pipelines

Archivo: `azure-pipelines.yml`. Agente `ubuntu-latest`. Push a `main` y pull requests hacia `main`.

| Paso                   | Herramienta                    | Qué hace                                                                                                 |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1. Runtime             | `NodeTool@0` (Node 20)         | Instala Node.                                                                                            |
| 2. Quality gate        | npm + ESLint + `tsc` + Vitest  | Igual que el CI de GitHub.                                                                               |
| 3. E2E                 | `scripts/ci-playwright-k8s.sh` | Mismos manifiestos, PVC, recolector y `merge-reports` que GitHub, con la imagen local `:latest`.         |
| 4. JUnit               | `PublishTestResults@2`         | Publica el XML consolidado `test-results/**/*.xml`.                                                      |
| 5. Resto de evidencias | `PublishPipelineArtifact@1`    | HTML oficial, reportes por Pod, `test-results`, blob y artefactos de AI. Siempre, aunque la suite falle. |

## 8) Docker / Kubernetes

### Docker

```bash
docker build -t qa-playwright-ai-framework .
docker run --rm -e TEST_ENV=qa --shm-size=1g \
  -v ${PWD}/playwright-report:/app/playwright-report \
  -v ${PWD}/test-results:/app/test-results \
  -v ${PWD}/blob-report:/app/blob-report \
  -v ${PWD}/artifacts:/app/artifacts \
  qa-playwright-ai-framework
```

### Docker Compose

Monta `playwright-report`, `test-results`, `blob-report` y `artifacts` en el host. La imagen corre como uid 1001: en Linux, esas carpetas del host tienen que ser escribibles por ese uid. En Docker Desktop no hace falta nada.

```bash
docker compose up --build
```

### Kubernetes

Todo vive en el namespace `qa-playwright`. El Job crea un Pod por shard y el mock API lo arranca Playwright dentro de cada contenedor. Para cambiar el número de shards, edita solo `completions` y `parallelism` en `k8s/job.yaml`: Kustomize copia el valor a `SHARD_TOTAL`.

`bash scripts/ci-playwright-k8s.sh` hace el flujo completo: build, kind, Job, recolección y merge. Con `SKIP_BUILD=true` reutiliza una imagen ya construida. Paso a paso:

```bash
docker build -t qa-playwright-ai-framework:latest .
kind load docker-image qa-playwright-ai-framework:latest --name qa-playwright

kubectl -n qa-playwright delete job qa-playwright-tests --ignore-not-found
kubectl -n qa-playwright delete pvc qa-playwright-evidence --ignore-not-found
kubectl apply -k k8s
kubectl -n qa-playwright wait --for=condition=Complete job/qa-playwright-tests --timeout=25m

kubectl apply -k k8s/collector
kubectl -n qa-playwright wait --for=condition=Ready pod/qa-playwright-evidence-collector
kubectl -n qa-playwright cp qa-playwright-evidence-collector:/evidence/. pod-reports
kubectl -n qa-playwright delete pod qa-playwright-evidence-collector

mkdir -p blob-report
for shard in pod-reports/shard-*; do
  cat "${shard}/exit-code"
  cp "${shard}/blob-report/"*.zip "blob-report/$(basename "${shard}").zip"
done
npx playwright merge-reports -c playwright.merge.config.ts blob-report
```

Si la suite falla, el Job termina en `Failed` en vez de `Complete`; la evidencia sigue en el PVC y se recoge igual.

Detrás de un proxy corporativo que intercepta TLS, SauceDemo falla con `ERR_CERT_AUTHORITY_INVALID` dentro del clúster. Solo en ese caso, pon `IGNORE_HTTPS_ERRORS: 'true'` en el ConfigMap de tu copia local. El valor por defecto es `false`.

`playwright-report/index.html` es el reporte oficial. `pod-reports/shard-<n>/` conserva el HTML, el XML, las trazas y el `exit-code` de cada shard. En push a `main`, CI publica ese HTML en GitHub Pages.

## 9) Calidad local

El detalle de ESLint, Prettier, Husky, lint-staged y `tsc` está en el paso local de la sección 7. TypeScript corre en modo strict.

## 10) Próximos pasos recomendados

1. Integrar proveedor LLM para sugerir/parchar locators basado en `ai-suggestions.json`.
2. Añadir contract testing de API (JSON schema fuerte por endpoint).
3. Añadir dashboard histórico de fallos/flakiness por suite.
4. Añadir estrategia de secretos real para pipelines (Azure Variable Groups/Key Vault).
