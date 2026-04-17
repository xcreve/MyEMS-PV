FROM docker.m.daocloud.io/library/eclipse-temurin:17-jre
WORKDIR /app

RUN mkdir -p /data/ruoyi/uploadPath
COPY ruoyi-java-myems/ruoyi-admin/target/ruoyi-admin.jar /app/ruoyi-admin.jar

EXPOSE 8080
ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/ruoyi-admin.jar"]
