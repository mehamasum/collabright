FROM python:3.7-slim

# node env
ARG NODE_VERSION=12.13.0
ENV NVM_DIR=/usr/local/.nvm
RUN mkdir $NVM_DIR
ARG NODE_BIN=$NVM_DIR/versions/node/v$NODE_VERSION/bin
ENV PATH=$NODE_BIN:$PATH


# Install packages needed to run your application (not build deps):
#   mime-support -- for mime types when serving static files
#   postgresql-client -- for running database commands
# We need to recreate the /usr/share/man/man{1..8} directories first because
# they were clobbered by a parent image.
RUN set -ex \
    && RUN_DEPS=" \
    libpcre3 \
    mime-support \
    postgresql-client \
    nginx \
    " \
    && seq 1 8 | xargs -I{} mkdir -p /usr/share/man/man{} \
    && apt-get update && apt-get install -y --no-install-recommends $RUN_DEPS \
    && rm -rf /var/lib/apt/lists/*

# Copy in your requirements file
COPY requirements.txt /app/requirements.txt

# Install build deps, then run `pip install`, then remove unneeded build deps all in a single step.
# Correct the path to your production requirements file, if needed.
RUN set -ex \
    && BUILD_DEPS=" \
    curl \
    build-essential \
    libpcre3-dev \
    libpq-dev \
    " \
    && apt-get update && apt-get install -y --no-install-recommends $BUILD_DEPS \
    && pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir uwsgi \
    \
    && curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install ${NODE_VERSION} \
    && nvm use v${NODE_VERSION} \
    && nvm alias default v${NODE_VERSION} \
    \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $BUILD_DEPS \
    && rm -rf /var/lib/apt/lists/*

COPY ./package*.json /tmp/
RUN cd /tmp && npm install && rm -rf /usr/local/share/.cache

COPY ./scripts/docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY ./scripts/docker/nginx.conf /etc/nginx/sites-enabled/

COPY . /app
RUN ln -s /tmp/node_modules /app/node_modules

WORKDIR /app

ENTRYPOINT ["/entrypoint.sh"]
