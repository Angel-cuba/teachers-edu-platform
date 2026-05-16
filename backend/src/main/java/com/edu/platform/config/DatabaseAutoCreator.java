package com.edu.platform.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Automatically creates the PostgreSQL database on startup if it doesn't exist.
 * Uses BeanFactoryPostProcessor so it runs before JPA/Hibernate try to connect.
 */
@Slf4j
@Component
public class DatabaseAutoCreator implements BeanFactoryPostProcessor, EnvironmentAware {

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        String url      = environment.getProperty("spring.datasource.url", "");
        String username = environment.getProperty("spring.datasource.username", "");
        String password = environment.getProperty("spring.datasource.password", "");

        if (!url.startsWith("jdbc:postgresql")) return;

        String dbName = extractDbName(url);
        if (dbName == null || dbName.isBlank()) return;

        // Connect to the maintenance "postgres" database to be able to create ours
        String maintenanceUrl = url.replaceFirst("/[^/?]+(\\?.*)?$", "/postgres$1");

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(maintenanceUrl, username, password);
                 Statement  stmt = conn.createStatement()) {

                ResultSet rs = stmt.executeQuery(
                        "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'"
                );

                if (!rs.next()) {
                    log.info("Database '{}' not found — creating it automatically...", dbName);
                    stmt.execute("CREATE DATABASE \"" + dbName + "\"");
                    log.info("Database '{}' created successfully.", dbName);
                } else {
                    log.info("Database '{}' already exists — OK.", dbName);
                }
            }
        } catch (Exception e) {
            // Log as warning only: if PostgreSQL is unreachable the normal startup error
            // will surface a clearer message anyway.
            log.warn("DatabaseAutoCreator: could not check/create database '{}': {}", dbName, e.getMessage());
        }
    }

    /** Extracts the database name from a jdbc:postgresql://host:port/dbname[?params] URL */
    private String extractDbName(String url) {
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash < 0) return null;
        String tail = url.substring(lastSlash + 1);
        int q = tail.indexOf('?');
        return q >= 0 ? tail.substring(0, q) : tail;
    }
}
