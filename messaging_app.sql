DROP DATABASE IF EXISTS messaging_app;
CREATE DATABASE messaging_app;
\c messaging_app

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE user_activity AS ENUM ('offline', 'online', 'typing');

CREATE OR REPLACE FUNCTION update_modified() RETURNS TRIGGER AS $$
BEGIN
  NEW.modified = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TABLE users (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR ( 255 ) UNIQUE NOT NULL,
  password VARCHAR ( 255 ) NOT NULL,
  activity user_activity DEFAULT 'offline',
  is_guest BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendships (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  state request_status DEFAULT 'pending',
  modified TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER friendships_update_modified
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE PROCEDURE update_modified();

create table friendship_agents (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  friendship_id INT NOT NULL REFERENCES friendships ( id ) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users ( id ),
  is_initiator BOOLEAN DEFAULT TRUE
);

CREATE TABLE direct_chats (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
);

CREATE TABLE groups (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR ( 255 ) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE permission_type AS ENUM ('member', 'admin', 'owner');

CREATE TABLE memberships (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  group_id INT NOT NULL REFERENCES groups ( id ),
  user_id INT NOT NULL REFERENCES users ( id ),
  permission permission_type DEFAULT 'member',
  state request_status DEFAULT 'pending',
  modified TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER memberships_update_modified
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE PROCEDURE update_modified();

create table messages (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  text TEXT NOT NULL,
  group_id INT REFERENCES groups ( id ),
  direct_chat_id INT REFERENCES direct_chats ( id ),
  user_id INT NOT NULL REFERENCES users ( id ),
  is_deleted BOOLEAN DEFAULT FALSE,
  created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE direct_chat_agents (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  direct_chat_id INT NOT NULL REFERENCES direct_chats ( id ) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users ( id ),
  is_shown BOOLEAN DEFAULT FALSE,
  time_shown TIMESTAMPTZ
);

INSERT INTO users ( name, password, created ) VALUES
  ( 'windseeker', '$2b$12$ZQ05Ky96Gb3Q9JAypVTEve6RvpgfMn87MvxIjaviL/BYANYnRTjO6', '2020-02-29 18:52:12+06' ),  --password: 'alpha59'
  ( 'obb', '$2b$12$tFMKHDOkvOyEoi8VUuKkJeWWiS3BiyAF/ggTqu3Y1HFk9NDQgifEa', '2023-09-30 09:07:00+07' ), --password: 'run381'
  ( 'hill', '$2b$12$HMM/HAq5b0JpF5DioPDAVu8X2g605cjiy1v40mrpbRU3bEBa9ENiq', '2024-09-01 22:57:22+04' ), --password: 'bee290'
  ( 'gin', '$2b$12$zdeIFquDwD93Z5E/Zew0IeB2ewrj4.DkzdDbgNGugsg.hnLEySQq6', '2024-10-13 09:07:00-01' ), --password: 'yoyo31'
  ( 'hue', '$2b$12$XgMmCwwxwkQ7NDVFomhVRuY4LKTbxuENFCzbBqcjsYWAVI1tQzJ4S', '2024-10-14 10:07:00-03' ), --password: 'loop48'
  ( 'alex', '$2b$12$44RXTKzaEA.pi5xvN3qz/u2VfJu7KYUHfs/mLoc92T40irezOmTtS', '2024-10-15 10:07:00+08' ), --password: 'rain61'
  ( 'john_lock_door', '$2b$12$0B4YUhkMB3BhdljuLZrnVeGeQNHf1/PLE7oYm9igkbIY.zzkSc0H2', '2024-10-16 10:07:00+08' ), --password: 'pin141'
  ( 'bob_train', '$2b$12$n4R06F2BYEkw0rDnDebeqOm5p60/QuYj6ppkGAJfYKsDB8xFIM90S', '2024-10-17 10:07:00+08' ), --password: 'keg590'
  ( 'lock', '$2b$12$beSME/2kKsIioQg8WvAwy.Tos5Lfc6BsRDgYb7XdqtAv51jYfMCGu', '2024-10-18 10:07:00+08' ), --password: 'bun390'
  ( 'orange', '$2b$12$jWyt8QZtUdvdZqYKZaRTo.HmV8zCGN9q3INHLlHTKn1SNoO17yXsK', '2024-10-19 10:07:00+08' ); --password: 'sweet20'

INSERT INTO users ( name, password, created, is_deleted ) VALUES
  ( 'erased_user', '', '2024-08-20 10:07:00+08', TRUE );

INSERT INTO friendships ( state, modified ) VALUES
  ( 'accepted', '2023-10-13 09:07:00+07' ),
  ( 'accepted', '2024-09-02 02:07:00+06' ),
  ( 'rejected', '2024-10-14 19:07:00+06' ),
  ( 'pending', '2024-10-15 07:07:00+06' ),
  ( 'rejected', '2024-10-16 19:07:00+06' ),
  ( 'pending', '2024-10-17 07:07:00+06' ),
  ( 'accepted', '2024-10-18 07:07:00+06' ),
  ( 'accepted', '2024-10-18 07:08:00+06' ),
  ( 'accepted', '2024-10-18 07:09:00+06' );

INSERT INTO friendship_agents ( friendship_id, user_id, is_initiator ) VALUES
  ( 1, 2, TRUE ),
  ( 1, 1, FALSE ),
  ( 2, 1, TRUE ),
  ( 2, 3, FALSE ),
  ( 3, 1, TRUE ),
  ( 3, 4, FALSE ),
  ( 4, 1, TRUE ),
  ( 4, 5, FALSE ),
  ( 5, 6, TRUE ),
  ( 5, 1, FALSE ),
  ( 6, 7, TRUE ),
  ( 6, 1, FALSE ),
  ( 7, 5, TRUE ),
  ( 7, 7, FALSE ),
  ( 8, 8, TRUE ),
  ( 8, 1, FALSE ),
  ( 9, 9, TRUE ),
  ( 9, 1, FALSE );

INSERT INTO direct_chats VALUES
  ( DEFAULT ),
  ( DEFAULT ),
  ( DEFAULT ),
  ( DEFAULT );

INSERT INTO groups ( name, created ) VALUES
  ( 'comics_galore', '2020-08-31 13:07:30+06' ),
  ( 'Fruit_Pavilion', '2020-10-01 14:07:35+07' ),
  ( 'bro', '2024-09-06 7:57:58+04' ),
  ( 'ender', '2024-10-02 8:00:00-01' ),
  ( 'whatever', '2024-10-03 8:00:00-01' ),
  ( 'palace', '2024-10-04 8:00:00-01' );
  
INSERT INTO groups ( name, is_public ) VALUES
  ( 'free', TRUE );

INSERT INTO groups ( name, is_deleted ) VALUES
  ( 'erased_group', TRUE );

INSERT INTO memberships ( group_id, user_id, permission, state, modified ) VALUES
  ( 1, 1, 'owner', 'accepted', '2020-08-31 13:07:30+06' ),
  ( 1, 2, 'member', 'accepted', '2023-10-24 13:07:30+07' ),
  ( 1, 3, 'admin', 'accepted', '2024-09-01 13:07:30+04' ),
  ( 1, 4, 'member', 'pending', '2024-09-01 14:07:30+04' ),
  ( 1, 5, 'member', 'pending', '2024-09-01 15:07:30+04' ),
  ( 1, 6, 'member', 'rejected', '2024-09-01 16:07:30+04' ),
  
  ( 2, 2, 'owner', 'accepted', '2020-10-01 14:07:35+07' ),
  ( 2, 1, 'admin', 'accepted', '2024-10-25 13:45:20+06' ),
  ( 2, 5, 'admin', 'accepted', '2024-10-25 13:45:20+06' ),
  ( 2, 3, 'member', 'accepted', '2024-10-25 14:45:20+06' ),
  ( 2, 4, 'member', 'pending', '2024-10-25 15:45:20+06' ),
  ( 2, 6, 'member', 'rejected', '2024-10-25 16:45:20+06' ),

  ( 3, 2, 'owner', 'accepted', '2024-09-06 7:57:58+04' ),
  ( 3, 1, 'member', 'accepted', '2024-09-06 7:58:30+04' ),
  ( 3, 5, 'admin', 'accepted', '2024-09-06 7:58:30+04' ),
  ( 3, 3, 'member', 'accepted', '2024-09-06 8:58:30+04' ),
  ( 3, 4, 'member', 'pending', '2024-09-06 9:58:30+04' ),
  ( 3, 6, 'member', 'rejected', '2024-09-06 10:58:30+04' ),
  
  ( 4, 2, 'owner', 'accepted', '2024-10-02 8:00:00-01' ),
  ( 4, 1, 'member', 'pending', '2024-10-02 9:00:00-01' ),

  ( 5, 3, 'owner', 'accepted', '2024-10-02 9:00:00-01' ),
  ( 5, 1, 'member', 'rejected', '2024-10-03 9:00:00-01' ),

  ( 6, 3, 'owner', 'accepted', '2024-10-04 9:00:00-01' ),
  ( 7, 3, 'owner', 'accepted', '2024-10-04 9:00:00-01' );

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

INSERT INTO messages ( text, direct_chat_id, user_id, created ) VALUES
  ( 'How are you', 1, 1, '2024-10-31 13:57:58+06' ),
  ( 'When are you free', 2, 1, '2024-11-01 13:59:58+07' ),
  ( 'Hi', 3, 8, '2024-11-01 13:59:58-01' ),
  ( 'can you see this', 4, 9, '2024-11-01 14:59:58-01' ),
  ( 'you still there', 1, 1, '2024-11-02 13:58:58+06' ),
  ( 'I am fine', 1, 3, '2024-11-03 13:59:58+04' ),
  ( 'great', 1, 1, '2024-11-04 13:57:58+06' );

INSERT INTO messages ( text, group_id, user_id, is_deleted, created ) VALUES
  ( '', 1, 11, TRUE, '2023-10-22 13:59:58+06' ),
  ( '', 1, 11, TRUE,'2023-10-23 13:59:58+06' ),
  ( '', 1, 11, TRUE,'2023-10-23 13:59:59+06' ),
  ( '', 1, 11, TRUE,'2024-12-23 13:59:59+06' );

INSERT INTO direct_chat_agents ( direct_chat_id, user_id, is_shown, time_shown ) VALUES
  ( 1, 1, TRUE, '2024-10-31 13:57:58+06'),
  ( 1, 3, TRUE, '2024-10-31 13:57:58+06'),
  ( 2, 1, TRUE, '2024-11-01 13:59:58+07'),
  ( 2, 2, FALSE, '2024-11-01 13:59:58+07'),
  ( 3, 1, TRUE, '2024-11-01 13:59:58-01'),
  ( 3, 8, FALSE, '2024-11-01 13:59:58-01'),
  ( 4, 9, TRUE, '2024-11-01 14:59:58-01'),
  ( 4, 1, FALSE, '2024-11-01 14:59:58-01');
