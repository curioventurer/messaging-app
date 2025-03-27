# Messaging App

[Live Site](https://messaging-app-production-b3c6.up.railway.app)

This is a portfolio project. It is a fullstack SPA web application that allows real time exchange of plain text messages in private and group chats.

- The frontend is built with React, while the backend runs on NodeJS.
- Express is used to create CRUD APIs.
- SPA is implemented using React Router for internal routing between pages. The pages are made dynamic by making API calls to the server.
- Authentication is done with Passport and the stored password is salted and hashed. Login is retained with signed cookies storing the user’s id.
- Real time exchange of messages and interaction between users is enabled with Socket.IO.
- Data is stored between multiple relational tables in PostgreSQL.
- The React frontend is developed and built with Vite. Vite Express is used to integrate Vite’s development server with the backend to enable data fetches in the frontend during development.

## Images

![Chat Room](/docs/chat_room.png)
![Group Info](/docs/group_info.png)
![Home](/docs/home.png)
![Group Panel](/docs/group_panel.png)
![Friendship Panel](/docs/friendship_panel.png)
![Profile](/docs/profile.png)
![Group List](/docs/group_list.png)
![User List](/docs/user_list.png)
![Register](/docs/register.png)
![Index](/docs/index.png)
