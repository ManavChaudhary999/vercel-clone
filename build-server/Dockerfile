FROM ubuntu:focal

# Install dependencies
RUN apt-get update
RUN apt-get install -y curl
# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Install git
RUN apt-get install -y git

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

# Fix line endings and ensure proper shebang
RUN sed -i 's/\r$//' main.sh && \
    sed -i '1i #!/bin/bash' main.sh

RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.js

ENTRYPOINT ["/home/app/main.sh"]
