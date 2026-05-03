package com.fillos.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${DB_URL:${DATABASE_URL:jdbc:postgresql://localhost:5432/foodapp}}")
    private String dbUrl;

    @Value("${DB_USER:postgres}")
    private String dbUser;

    @Value("${DB_PASSWORD:postgres}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String finalUrl = dbUrl;

        // Render provides DATABASE_URL in the format postgres://user:pass@host:port/db
        // Hikari requires jdbc:postgresql://
        if (finalUrl != null && finalUrl.startsWith("postgres://")) {
            finalUrl = finalUrl.replaceFirst("postgres://", "jdbc:postgresql://");
        } else if (finalUrl != null && finalUrl.startsWith("postgresql://")) {
            finalUrl = finalUrl.replaceFirst("postgresql://", "jdbc:postgresql://");
        }

        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .url(finalUrl)
                .username(dbUser)
                .password(dbPassword)
                .build();
    }
}
