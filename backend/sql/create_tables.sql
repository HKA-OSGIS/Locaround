CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    location VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    latitude FLOAT,
    longitude FLOAT,
    description TEXT
);
