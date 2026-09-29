FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app
RUN chown pwuser:pwuser /app

# Numeric user so Kubernetes can verify runAsNonRoot.
USER 1001

COPY --chown=1001:1001 package*.json ./
RUN npm ci

COPY --chown=1001:1001 . .

ENV TEST_ENV=qa

CMD ["npm", "run", "test:all:qa"]
