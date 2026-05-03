# Step 1: Build jar using Maven
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copy ONLY the pom file first
COPY pom.xml .

# 2. Download dependencies (this layer will be cached!)
RUN mvn dependency:go-offline -B

# 3. Now copy the source code
COPY src ./src

# 4. Build the package (will be much faster now)
RUN mvn clean package -DskipTests

# Step 2: Run jar
FROM eclipse-temurin:21-jre-alpine 
# ^ Note: Use 'jre-alpine' to make the final image 3x smaller
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
