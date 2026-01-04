CREATE TABLE login_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    code INTEGER NOT NULL,
    first_login_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    last_code_sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX login_user_code_idx ON login_user(code);
