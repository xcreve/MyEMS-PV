FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY ruoyi-java-myems/ .
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN mkdir -p /data/ruoyi/uploadPath
COPY --from=builder /build/ruoyi-admin/target/ruoyi-admin.jar /app/ruoyi-admin.jar
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/ruoyi-admin.jar"]
