DROP DATABASE IF EXISTS messaging_app;
CREATE DATABASE messaging_app;
\c messaging_app

CREATE TABLE users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR ( 255 ) NOT NULL,
  password VARCHAR ( 255 ) NOT NULL,
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE friend_request_type AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE friendships (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sender_id INT NOT NULL REFERENCES users ( id ),
  receiver_id INT NOT NULL REFERENCES users ( id ),
  state friend_request_type DEFAULT 'pending',
  modified TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_modified()
        RETURNS TRIGGER AS '
  BEGIN
    NEW.modified = NOW();
    RETURN NEW;
  END;
' language 'plpgsql';

CREATE TRIGGER friendships_update_modified_trigger BEFORE UPDATE
  ON friendships FOR EACH ROW EXECUTE PROCEDURE
  update_modified();

CREATE TABLE groups (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR ( 255 ) NOT NULL,
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE permission_type AS ENUM ('member', 'admin', 'owner');

CREATE TABLE memberships (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  group_id INT NOT NULL REFERENCES groups ( id ),
  user_id INT NOT NULL REFERENCES users ( id ),
  permission permission_type DEFAULT 'member',
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table messages (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  text VARCHAR ( 255 ) NOT NULL,
  group_id INT NOT NULL REFERENCES groups ( id ),
  user_id INT NOT NULL REFERENCES users ( id ),
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users ( name, password, created ) VALUES
  ( 'windseeker', 'alpha', '2020-02-29 18:52:12+06' ),
  ( 'obb', 'run', '2023-09-30 09:07:00+07' ),
  ( 'hill', 'bee', '2024-09-01 22:57:22+04' ),
  ( 'gin', 'yoyo', '2024-10-13 09:07:00-01' ),
  ( 'hue', 'loop', '2024-10-14 10:07:00-03' ),
  ( 'alex', 'rain', '2024-10-15 10:07:00+08' ),
  ( 'john lock door', 'pin', '2024-10-16 10:07:00+08' ),
  ( 'bob train', 'keg', '2024-10-17 10:07:00+08' );

INSERT INTO friendships ( sender_id, receiver_id, state, modified ) VALUES
  ( 2, 1, 'accepted', '2023-10-13 09:07:00+07' ),
  ( 1, 3, 'accepted', '2024-09-02 02:07:00+06' ),
  ( 1, 4, 'rejected', '2024-10-14 19:07:00+06' ),
  ( 1, 5, 'pending', '2024-10-15 07:07:00+06' ),
  ( 6, 1, 'rejected', '2024-10-16 19:07:00+06' ),
  ( 7, 1, 'pending', '2024-10-17 07:07:00+06' ),
  ( 5, 7, 'accepted', '2024-10-18 07:07:00+06' );

INSERT INTO groups ( name, created ) VALUES
  ( 'comics galore', '2020-08-31 13:07:30+06' ),
  ( 'Fruit Pavilion', '2020-10-01 14:07:35+07' ),
  ( 'bro', '2024-09-06 7:57:58+04' ),
  ( 'ender', '2024-10-02 8:00:00-01' );

INSERT INTO memberships ( group_id, user_id, permission, created ) VALUES
  ( 1, 1, 'owner', '2020-08-31 13:07:30+06' ),
  ( 1, 2, 'member', '2023-10-24 13:07:30+07' ),
  ( 1, 3, 'admin', '2024-09-01 13:07:30+04' ),
  ( 2, 2, 'owner', '2020-10-01 14:07:35+07' ),
  ( 2, 1, 'member', '2024-10-25 13:45:20+06' ),
  ( 3, 2, 'owner', '2024-09-06 7:57:58+04' ),
  ( 3, 1, 'member', '2024-09-06 7:58:30+04' ),
  ( 4, 1, 'owner', '2024-10-02 8:00:00-01' );

INSERT INTO messages ( text, group_id, user_id, created ) VALUES
  ( 'A new comic is releasing soon.', 1, 1, '2020-10-25 13:57:58+06' ),
  ( 'I will post later', 1, 1, '2020-10-25 13:59:58+06' ),
  ( 'I forgot', 1, 1, '2020-10-26 13:59:58+06' ),
  ( 'This place is inactive', 1, 2, '2023-10-26 08:37:56+07' ),
  ( 'hello there', 1, 3, '2024-09-26 18:32:56+04' ),
  ( 'and goodbye', 1, 2, '2024-09-26 21:33:56+07' ),
  ( 'This place is boring', 1, 3, '2024-10-16 09:32:56+04' ),
  ( 'This is a sentence. Also haha see this: boo', 3, 1, '2024-10-26 8:33:40+06' ),
  ( 'What the hell', 3, 2, '2024-10-26 9:33:56.3+07' ),
  ( '.', 3, 1, '2024-10-26 8:33:56.5+06' ),
  ( 'a story about a bunch of misfits.', 1, 3, '2024-10-26 6:45:20+04' ),
  ( 'All kinds of fruits are sold at our shops.', 2, 2, '2024-10-26 10:48:02+07' ),
  ( 'Please visit soon.', 2, 2, '2024-10-26 10:49:20+07' ),
  ( 'your fruits looks nice and all but it is tasteless...', 2, 1, '2024-10-26 13:45:20+06' ),
  ( 'take my money', 1, 2, '2024-10-27 6:45:20+07' ),
  ( 'Why are you here', 1, 2, '2024-10-28 08:32:56+07' ),
  ( 'this place is supposed provide news on stuffs', 1, 1, '2024-10-29 10:32:56+06' ),
  ( 'abandoned though', 1, 2, '2024-10-30 11:32:56+07' );
