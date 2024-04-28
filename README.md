# PZOJ

online judge + learning platform, all-in-one!!

notes when setting up the judge:

- the client listens on port 3000 while the server listens on port 3001 and the websocket server listens on port 3002
- this means you must configure nginx to route them both to port 80
- e.g.:
```
server {
  listen 80;
  listen [::]:80;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_buffers 8 16k;
    proxy_buffer_size 16k;
  }

  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_buffers 8 16k;
    proxy_buffer_size 16k;
  }

  location /ws {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_buffers 8 16k;
    proxy_buffer_size 16k;
  }
}
```
