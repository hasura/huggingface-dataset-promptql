FROM ghcr.io/hasura/ndc-duckduckapi:v0.5.3

COPY package-lock.json package.json /functions/

WORKDIR /functions
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY ./ /functions
