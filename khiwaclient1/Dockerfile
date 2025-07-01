# Étape de construction
FROM ubuntu:22.04 as build

# Installer les dépendances nécessaires pour Flutter
RUN apt-get update && \
    apt-get install -y \
    curl \
    unzip \
    git \
    xz-utils \
    libglu1-mesa

# Installer Flutter
RUN curl -L https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.19.0-stable.tar.xz | tar -C /opt -xJ
ENV PATH="$PATH:/opt/flutter/bin"

# Configurer l'environnement
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter build web

# Étape d'exécution
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]