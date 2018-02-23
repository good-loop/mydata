server {
	listen	80;
	listen	[::]:80;
	listen	443 ssl http2;
	listen	[::]:443 ssl http2;

	include /home/winterwell/mydata/config/ssl.mydata.good-loop.com.conf;
	include /home/winterwell/mydata/config/ssl.mydata.good-loop.com.params.conf;

	access_log /var/log/nginx/mydata.good-loop.com/access.log;
	error_log /var/log/nginx/mydata.good-loop.com/error.log;

	root /home/winterwell/mydata/web;
	index index.html;
 
	server_name mydata.good-loop.com;
	if ($scheme = http) {
			return 301 https://$server_name$request_uri;
		}
 
	location / {
		try_files $uri $uri/ @backend;
	}
 
	# Port 8652 for Profile Server
	location @backend {
		proxy_pass		http://localhost:8652;
		proxy_set_header	X-Real-IP $remote_addr;
		proxy_set_header	X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header	Host $http_host;
	}
}