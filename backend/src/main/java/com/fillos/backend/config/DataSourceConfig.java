package com.fillos.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

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
        String finalUser = dbUser;
        String finalPassword = dbPassword;

        // Render provides DATABASE_URL in the format postgres://user:pass@host:port/db
        // Hikari requires jdbc:postgresql://
        if (finalUrl != null && (finalUrl.startsWith("postgres://") || finalUrl.startsWith("postgresql://"))) {
            try {
                URI dbUri = new URI(finalUrl);
                String userInfo = dbUri.getUserInfo();
                if (userInfo != null) {
                    String[] auth = userInfo.split(":");
                    if (auth.length > 0) finalUser = auth[0];
                    if (auth.length > 1) finalPassword = auth[1];
                }
                String port = dbUri.getPort() == -1 ? "" : ":" + dbUri.getPort();
                finalUrl = "jdbc:postgresql://" + dbUri.getHost() + port + dbUri.getPath();
            } catch (URISyntaxException e) {
                finalUrl = finalUrl.replaceFirst("postgres(ql)?://", "jdbc:postgresql://");
            }
        }

        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .url(finalUrl)
                .username(finalUser)
                .password(finalPassword)
                .build();
    }
}
