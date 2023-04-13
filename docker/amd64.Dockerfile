FROM amd64/node:18-slim
ENV WORKINGDIR /app
WORKDIR ${WORKINGDIR}

ADD package.json ${WORKINGDIR}/package.json
ADD .eslintrc.json ${WORKINGDIR}/.eslintrc.json
ADD tsconfig.json ${WORKINGDIR}/tsconfig.json
ADD index.d.ts ${WORKINGDIR}/index.d.ts
ADD setup ${WORKINGDIR}/setup
ADD src ${WORKINGDIR}/src
ADD .well-known ${WORKINGDIR}/.well-known
ADD static ${WORKINGDIR}/static

RUN npm install -q && \
    npm run build && \
    npm run eslint && \
    npm prune --production && \
    rm -f .eslintrc.json && \
    rm -f tsconfig.json && \
    rm -f index.d.ts && \
    rm -rf setup && \
    rm -rf src

EXPOSE 8084

ENTRYPOINT ["node", "./dist/index"]
