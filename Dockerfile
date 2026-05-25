FROM nginx:alpine
COPY . /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/supabase \
           /usr/share/nginx/html/sql \
           /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.claude
EXPOSE 80
