CREATE TABLE authorized_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL
        CHECK (role IN (
            'Admin',
            'ConcertMaster',
            'MusicEditor',
            'DivisionChair'
        ))
);
