# ========== STAGE 1: BUILD ==========
FROM eclipse-temurin:17-jdk-alpine AS build

WORKDIR /app

# Copia Maven Wrapper e pom.xml primeiro (para cache de dependências)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Garante permissão de execução no mvnw
RUN chmod +x mvnw

# Baixa dependências (fica em cache se pom.xml não mudar)
RUN ./mvnw dependency:resolve -B

# Copia o código fonte
COPY src/ src/

# Build do JAR (skip tests para deploy mais rápido)
RUN ./mvnw package -DskipTests -B

# ========== STAGE 2: RUNTIME ==========
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copia o JAR gerado do stage de build
COPY --from=build /app/target/*.jar app.jar

# Porta padrão do Render (10000) — configurável via variável de ambiente
EXPOSE 8080

# Variáveis de ambiente padrão para produção
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Entrypoint
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
