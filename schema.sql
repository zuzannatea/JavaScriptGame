DROP TABLE IF EXISTS users;
CREATE TABLE users 
(
    user_id TEXT PRIMARY KEY,
    password TEXT,
    is_guest INTEGER DEFAULT 0 
);

DROP TABLE IF EXISTS past_games;
CREATE TABLE past_games
(
    user_id TEXT, 
    timestamp DATETIME,
    score INTEGER,
    cheats_used BOOLEAN,
    PRIMARY KEY(user_id,timestamp),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
); 

